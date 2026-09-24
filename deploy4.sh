#!/bin/bash

# ============================================================
# TASKFLOW - BUILD / PUSH / KUBERNETES DEPLOY
# ============================================================

set -o pipefail

# ============================================================
# CONFIGURAÇÕES
# ============================================================

NAMESPACE="taskflow"

# Docker Hub
DOCKER_USER="joaobarbosa404"

BACKEND_IMAGE="${DOCKER_USER}/taskflow-backend"
FRONTEND_IMAGE="${DOCKER_USER}/taskflow-frontend"

# Secret da aplicação
# Repositórios Docker Hub são públicos,
# portanto não é necessário dockerhub-secret.
DOCKER_SECRET="dockerhub-secret"

# ============================================================
# CORES
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================
# FUNÇÕES
# ============================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_ok() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[JÁ EXISTE]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

section() {
    echo ""
    echo "============================================================"
    echo "$1"
    echo "============================================================"
    echo ""
}

# ============================================================
# TRATAMENTO DE ERRO
# ============================================================

handle_error() {

    log_error "Ocorreu uma falha durante o deploy."

    echo ""
    echo "Para investigar:"
    echo ""

    echo "kubectl get pods -n $NAMESPACE"
    echo "kubectl get events -n $NAMESPACE --sort-by=.lastTimestamp"

    echo ""

    exit 1
}

trap handle_error ERR

# ============================================================
# SOLICITAR VERSÃO
# ============================================================

section "VERSÃO DA APLICAÇÃO"

while true; do

    read -p "Informe a versão da imagem (ex: 1.0.0): " IMAGE_TAG

    if [[ "$IMAGE_TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        break
    fi

    log_error "Versão inválida."

    echo ""
    echo "Utilize o formato:"
    echo "  MAJOR.MINOR.PATCH"
    echo ""
    echo "Exemplo:"
    echo "  1.0.0"
    echo "  1.0.1"
    echo "  2.0.0"
    echo ""

done

# ============================================================
# DEFINIR IMAGENS
# ============================================================

BACKEND_VERSION="${BACKEND_IMAGE}:${IMAGE_TAG}"
FRONTEND_VERSION="${FRONTEND_IMAGE}:${IMAGE_TAG}"

# ============================================================
# INÍCIO
# ============================================================

section "TASKFLOW - BUILD / PUSH / DEPLOY"

log_info "Namespace alvo: $NAMESPACE"

log_info "Versão selecionada: $IMAGE_TAG"

log_info "Backend:"
log_info "$BACKEND_VERSION"

log_info "Frontend:"
log_info "$FRONTEND_VERSION"

# ============================================================
# 1 - VERIFICAR DOCKER
# ============================================================

section "[1/12] VERIFICANDO DOCKER"

if docker info >/dev/null 2>&1; then

    log_ok "Docker está disponível."

else

    log_error "Docker não está disponível."
    exit 1

fi

# ============================================================
# 2 - VERIFICAR AUTENTICAÇÃO DOCKER HUB
# ============================================================

section "[2/12] DOCKER HUB"

log_info "Verificando autenticação no Docker Hub..."

if docker info 2>/dev/null | grep -q "Username"; then

    log_ok "Docker Hub já está autenticado."

else

    log_warn "Docker Hub não está autenticado."

    echo ""
    echo "Informe o Access Token do Docker Hub."
    echo ""

    read -s -p "Docker Hub Access Token: " DOCKER_TOKEN

    echo ""
    echo ""

    if echo "$DOCKER_TOKEN" | docker login \
        --username "$DOCKER_USER" \
        --password-stdin; then

        log_ok "Autenticação no Docker Hub realizada com sucesso."

    else

        log_error "Falha na autenticação do Docker Hub."
        exit 1

    fi

fi

# ============================================================
# 3 - VERIFICAR SE AS IMAGENS JÁ EXISTEM
# ============================================================

section "[3/12] VALIDANDO IMAGENS"

log_info "Verificando Backend no Docker Hub..."

if docker manifest inspect "$BACKEND_VERSION" >/dev/null 2>&1; then

    BACKEND_EXISTS=true

    log_warn "Backend ${BACKEND_VERSION} já existe no Docker Hub."

else

    BACKEND_EXISTS=false

    log_info "Backend ${BACKEND_VERSION} ainda não existe."

fi

echo ""

log_info "Verificando Frontend no Docker Hub..."

if docker manifest inspect "$FRONTEND_VERSION" >/dev/null 2>&1; then

    FRONTEND_EXISTS=true

    log_warn "Frontend ${FRONTEND_VERSION} já existe no Docker Hub."

else

    FRONTEND_EXISTS=false

    log_info "Frontend ${FRONTEND_VERSION} ainda não existe."

fi

echo ""

# ============================================================
# 4 - BUILD BACKEND
# ============================================================

section "[4/12] BUILD BACKEND"

if [ "$BACKEND_EXISTS" = true ]; then

    log_warn "Build do Backend não será executado."

    log_info "A imagem ${BACKEND_VERSION} já existe."

else

    log_info "Construindo imagem do Backend..."

    docker build \
        -t "$BACKEND_VERSION" \
        ./backend

    log_ok "Imagem do Backend criada."

fi

# ============================================================
# 5 - BUILD FRONTEND
# ============================================================

section "[5/12] BUILD FRONTEND"

if [ "$FRONTEND_EXISTS" = true ]; then

    log_warn "Build do Frontend não será executado."

    log_info "A imagem ${FRONTEND_VERSION} já existe."

else

    log_info "Construindo imagem do Frontend..."

    docker build \
        -t "$FRONTEND_VERSION" \
        ./frontend

    log_ok "Imagem do Frontend criada."

fi

# ============================================================
# 6 - PUSH BACKEND
# ============================================================

section "[6/12] PUSH BACKEND"

if [ "$BACKEND_EXISTS" = true ]; then

    log_warn "Push do Backend não será executado."

    log_info "A imagem ${BACKEND_VERSION} já existe no Docker Hub."

else

    log_info "Enviando Backend para Docker Hub..."

    docker push "$BACKEND_VERSION"

    log_ok "Backend enviado para Docker Hub."

fi

# ============================================================
# 7 - PUSH FRONTEND
# ============================================================

section "[7/12] PUSH FRONTEND"

if [ "$FRONTEND_EXISTS" = true ]; then

    log_warn "Push do Frontend não será executado."

    log_info "A imagem ${FRONTEND_VERSION} já existe no Docker Hub."

else

    log_info "Enviando Frontend para Docker Hub..."

    docker push "$FRONTEND_VERSION"

    log_ok "Frontend enviado para Docker Hub."

fi

# ============================================================
# 8 - VERIFICAR KUBERNETES
# ============================================================

section "[8/12] VERIFICANDO KUBERNETES"

if kubectl cluster-info >/dev/null 2>&1; then

    log_ok "Cluster Kubernetes acessível."

else

    log_error "Não foi possível acessar o cluster Kubernetes."
    exit 1

fi

# ============================================================
# 9 - NAMESPACE
# ============================================================

section "[9/12] NAMESPACE"

if kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then

    log_warn "Namespace '$NAMESPACE' já existe."

else

    log_info "Criando namespace '$NAMESPACE'..."

    kubectl apply \
        -f k8s/namespace.yaml

    log_ok "Namespace '$NAMESPACE' criado."

fi

# ============================================================
# CONFIGMAP
# ============================================================

section "CONFIGMAP"

if kubectl get configmap taskflow-backend-config \
    -n "$NAMESPACE" >/dev/null 2>&1; then

    log_warn "ConfigMap 'taskflow-backend-config' já existe."
    log_info "Atualizando ConfigMap..."

fi

kubectl apply \
    -f k8s/configmap.yaml

log_ok "ConfigMap aplicado."

# ============================================================
# SECRET DA APLICAÇÃO
# ============================================================

section "SECRET DA APLICAÇÃO"

if kubectl get secret taskflow-backend-secret \
    -n "$NAMESPACE" >/dev/null 2>&1; then

    log_warn "Secret 'taskflow-backend-secret' já existe."
    log_info "Atualizando Secret..."

fi

kubectl apply \
    -f k8s/secret.yaml

log_ok "Secret da aplicação aplicado."

# ============================================================
# ATUALIZAR IMAGENS DOS DEPLOYMENTS
# ============================================================

section "ATUALIZANDO IMAGENS DOS DEPLOYMENTS"

log_info "Atualizando imagem do Backend no YAML..."

sed -i "s|image:.*|image: ${BACKEND_VERSION}|" \
    k8s/backend/deployment.yaml

log_ok "Backend atualizado para ${BACKEND_VERSION}"

log_info "Atualizando imagem do Frontend no YAML..."

sed -i "s|image:.*|image: ${FRONTEND_VERSION}|" \
    k8s/frontend/deployment.yaml

log_ok "Frontend atualizado para ${FRONTEND_VERSION}"

# ============================================================
# 10 - REDIS
# ============================================================

section "[10/12] REDIS"

log_info "Aplicando Redis Deployment..."

kubectl apply \
    -f k8s/redis/deployment.yaml

log_info "Aplicando Redis Service..."

kubectl apply \
    -f k8s/redis/service.yaml

log_info "Aguardando Redis ficar disponível..."

if kubectl rollout status \
    deployment/redis \
    -n "$NAMESPACE" \
    --timeout=120s; then

    log_ok "Redis está disponível."

else

    log_error "Redis não ficou disponível."

    echo ""
    log_info "Pods do Redis:"

    kubectl get pods \
        -n "$NAMESPACE" \
        -l app=redis

    echo ""

    log_info "Eventos:"

    kubectl get events \
        -n "$NAMESPACE" \
        --sort-by=.lastTimestamp

    exit 1

fi

# ============================================================
# 11 - BACKEND
# ============================================================

section "[11/12] BACKEND"

log_info "Aplicando Backend Deployment..."

kubectl apply \
    -f k8s/backend/deployment.yaml

log_info "Aplicando Backend Service..."

kubectl apply \
    -f k8s/backend/service.yaml

log_info "Aguardando Backend ficar disponível..."

if kubectl rollout status \
    deployment/backend \
    -n "$NAMESPACE" \
    --timeout=120s; then

    log_ok "Backend está disponível."

else

    log_error "Backend não ficou disponível."

    echo ""
    log_info "Pods do Backend:"

    kubectl get pods \
        -n "$NAMESPACE" \
        -l app=backend

    echo ""

    log_info "Eventos:"

    kubectl get events \
        -n "$NAMESPACE" \
        --sort-by=.lastTimestamp

    exit 1

fi

# ============================================================
# FRONTEND
# ============================================================

section "FRONTEND"

log_info "Aplicando Frontend Deployment..."

kubectl apply \
    -f k8s/frontend/deployment.yaml

log_info "Aplicando Frontend Service..."

kubectl apply \
    -f k8s/frontend/service.yaml

log_info "Aguardando Frontend ficar disponível..."

if kubectl rollout status \
    deployment/frontend \
    -n "$NAMESPACE" \
    --timeout=120s; then

    log_ok "Frontend está disponível."

else

    log_error "Frontend não ficou disponível."

    echo ""
    log_info "Pods do Frontend:"

    kubectl get pods \
        -n "$NAMESPACE" \
        -l app=frontend

    echo ""

    log_info "Eventos:"

    kubectl get events \
        -n "$NAMESPACE" \
        --sort-by=.lastTimestamp

    exit 1

fi

# ============================================================
# 12 - INGRESS
# ============================================================

section "[12/12] INGRESS"

if kubectl get ingress taskflow \
    -n "$NAMESPACE" >/dev/null 2>&1; then

    log_warn "Ingress 'taskflow' já existe."
    log_info "Atualizando Ingress..."

fi

kubectl apply \
    -f k8s/ingress.yaml

log_ok "Ingress aplicado."

# ============================================================
# STATUS
# ============================================================

section "STATUS DO AMBIENTE"

echo ""
echo "-------------------- PODS --------------------"

kubectl get pods \
    -n "$NAMESPACE" \
    -o wide

echo ""
echo "-------------------- SERVICES ----------------"

kubectl get services \
    -n "$NAMESPACE"

echo ""
echo "-------------------- DEPLOYMENTS -------------"

kubectl get deployments \
    -n "$NAMESPACE"

echo ""
echo "-------------------- INGRESS -----------------"

kubectl get ingress \
    -n "$NAMESPACE"

# ============================================================
# IMAGENS UTILIZADAS
# ============================================================

echo ""
echo "-------------------- IMAGENS -----------------"

echo "Backend:"
echo "$BACKEND_VERSION"

echo ""

echo "Frontend:"
echo "$FRONTEND_VERSION"

# ============================================================
# FINAL
# ============================================================

section "DEPLOY FINALIZADO"

log_ok "TaskFlow foi implantado com sucesso!"

echo ""

echo "Comandos úteis:"
echo ""

echo "Ver Pods:"
echo "kubectl get pods -n $NAMESPACE"

echo ""

echo "Acompanhar Pods:"
echo "kubectl get pods -n $NAMESPACE -w"

echo ""

echo "Ver eventos:"
echo "kubectl get events -n $NAMESPACE --sort-by=.lastTimestamp"

echo ""

echo "Backend logs:"
echo "kubectl logs -n $NAMESPACE -l app=backend -f"

echo ""

echo "Frontend logs:"
echo "kubectl logs -n $NAMESPACE -l app=frontend -f"

echo ""

echo "Redis:"
echo "kubectl exec -it -n $NAMESPACE deployment/redis -- redis-cli"

echo ""

echo "============================================================"
echo "                    TASKFLOW OK"
echo "============================================================"
