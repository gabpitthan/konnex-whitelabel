#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(tr -d '[:space:]' < "${PROJECT_DIR}/VERSION")"
VERSIONS_DIR="/root/whitelabel-whaticket-versions"
DESTINATION="${VERSIONS_DIR}/versao-${VERSION}"
ARCHIVE="whitelabel-whaticket-${VERSION}.tar.gz"

if ! [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+$ ]]; then
  echo "VERSION inválida: ${VERSION}" >&2
  exit 1
fi

if [[ -n "$(git -C "${PROJECT_DIR}" status --porcelain)" ]]; then
  echo "O snapshot exige um worktree limpo e commitado." >&2
  exit 1
fi

if [[ -e "${DESTINATION}" ]]; then
  echo "A versão ${VERSION} já possui snapshot: ${DESTINATION}" >&2
  exit 1
fi

mkdir -p "${DESTINATION}"

git -C "${PROJECT_DIR}" archive \
  --format=tar.gz \
  --prefix="whitelabel-whaticket-${VERSION}/" \
  --output="${DESTINATION}/${ARCHIVE}" \
  HEAD

COMMIT="$(git -C "${PROJECT_DIR}" rev-parse HEAD)"
BRANCH="$(git -C "${PROJECT_DIR}" branch --show-current)"
CREATED_AT="$(date --iso-8601=seconds)"

{
  echo "# Manifesto da versão ${VERSION}"
  echo
  echo "- Versão: ${VERSION}"
  echo "- Commit: ${COMMIT}"
  echo "- Branch: ${BRANCH}"
  echo "- Criado em: ${CREATED_AT}"
  echo "- Projeto de origem: ${PROJECT_DIR}"
  echo "- Arquivo: ${ARCHIVE}"
  echo
  echo "O snapshot contém apenas arquivos rastreados no Git e exclui segredos e dados operacionais."
} > "${DESTINATION}/MANIFEST.md"

cp "${PROJECT_DIR}/CHANGELOG.md" "${DESTINATION}/RELEASE_NOTES.md"

(
  cd "${DESTINATION}"
  sha256sum "${ARCHIVE}" > SHA256SUMS
)

echo "Snapshot criado em ${DESTINATION}"
