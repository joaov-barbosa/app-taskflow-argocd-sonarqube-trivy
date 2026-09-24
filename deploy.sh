#!/bin/bash

# ============================================================
# TASKFLOW - KUBERNETES DEPLOY
# ============================================================

set -o pipefail

NAMESPACE="taskflow"

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
# INÍCIO
# ============================================================

section "TASKFLOW - DEPLOY KUBERNETES"

log_info "Namespace alvo: $NAMESPACE"

# ============================================================
# 1 - VERIFICAR KUBERNETES
# ============================================================

section "[1/10] VERIFICANDO KUBERNETES"

if kubectl cluster-info >/dev/null 2>&1; then
    log_ok "Cluster Kubernetes acessível."
else
    log_error "Não foi possível acessar o cluster Kubernetes."
    exit 1
fi

# ============================================================
# 2 - NAMESPACE
# ============================================================

section "[2/10] NAMESPACE"

if kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then

    log_warn "Namespace '$NAMESPACE' já existe."

else

    log_info "Criando namespace '$NAMESPACE'..."

    kubectl apply -f k8s/namespace.yaml

    log_ok "Namespace '$NAMESPACE' criado."

fi

# ============================================================
# 3 - CONFIGMAP
# ============================================================

section "[3/10] CONFIGMAP"

if kubectl get configmap taskflow-backend-config \
    -n "$NAMESPACE" >/dev/null 2>&1; then

    log_warn "ConfigMap 'taskflow-backend-config' já existe."
    log_info "Atualizando ConfigMap..."

fi

kubectl apply -f k8s/configmap.yaml

log_ok "ConfigMap aplicado."

# ============================================================
# 4 - SECRET
# ============================================================

section "[4/10] SECRET"

if kubectl get secret taskflow-backend-secret \
    -n "$NAMESPACE" >/dev/null 2>&1; then

    log_warn "Secret 'taskflow-backend-secret' já existe."
    log_info "Atualizando Secret..."

fi

kubectl apply -f k8s/secret.yaml

log_ok "Secret aplicado."

# ============================================================
# 5 - REDIS
# ============================================================

section "[5/10] REDIS"

log_info "Aplicando Redis Deployment..."

kubectl apply -f k8s/redis/deployment.yaml

log_info "Aplicando Redis Service..."

kubectl apply -f k8s/redis/service.yaml

log_info "Aguardando Redis ficar disponível..."

if kubectl rollout status \
    deployment/redis \
    -n "$NAMESPACE" \
    --timeout=120s; then

    log_ok "Redis está disponível."

else

    log_error "Redis não ficou disponível."
    exit 1

fi

# ============================================================
# 6 - BACKEND
# ============================================================

section "[6/10] BACKEND"

log_info "Aplicando Backend Deployment..."

kubectl apply -f k8s/backend/deployment.yaml

log_info "Aplicando Backend Service..."

kubectl apply -f k8s/backend/service.yaml

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
# 7 - FRONTEND
# ============================================================

section "[7/10] FRONTEND"

log_info "Aplicando Frontend Deployment..."

kubectl apply -f k8s/frontend/deployment.yaml

log_info "Aplicando Frontend Service..."

kubectl apply -f k8s/frontend/service.yaml

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

    exit 1

fi

# ============================================================
# 8 - INGRESS
# ============================================================

section "[8/10] INGRESS"

if kubectl get ingress taskflow \
    -n "$NAMESPACE" >/dev/null 2>&1; then

    log_warn "Ingress 'taskflow' já existe."
    log_info "Atualizando Ingress..."

fi

kubectl apply -f k8s/ingress.yaml

log_ok "Ingress aplicado."

# ============================================================
# 9 - STATUS
# ============================================================

section "[9/10] STATUS DO AMBIENTE"

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
# 10 - FINAL
# ============================================================

section "[10/10] DEPLOY FINALIZADO"

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