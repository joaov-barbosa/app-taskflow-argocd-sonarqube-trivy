#!/bin/bash

# ============================================================
# INSTALAÇÃO BÁSICA - ARGO CD
# ============================================================

NAMESPACE="argocd"

echo "Criando namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

echo "Instalando Argo CD..."
kubectl create -n $NAMESPACE \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo
echo "Aguardando Argo CD..."
kubectl wait --for=condition=available \
  deployment/argocd-server \
  -n $NAMESPACE \
  --timeout=300s

echo
echo "============================================================"
echo "ARGO CD INSTALADO"
echo "============================================================"

echo
echo "Senha inicial:"
kubectl -n $NAMESPACE get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

echo
echo
echo "Para acessar:"
echo
echo "kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo
echo "Depois acesse:"
echo "https://localhost:8080"
echo
echo "Usuário: admin"
echo "============================================================"