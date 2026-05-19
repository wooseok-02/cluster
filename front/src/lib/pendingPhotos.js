// SPA 내비게이션 중 File 객체를 잃지 않기 위한 모듈 레벨 임시 저장소
// File 객체는 JSON 직렬화 불가, history state 크기 제한 초과 → navigate state 사용 불가
let _files = []
let _photoUploadSession = null
let _photoUploadGroup = null

export function setPendingFiles(files) {
  _files = files || []
}

export function takePendingFiles() {
  const files = _files
  _files = []
  return files
}

export function getPendingFiles() {
  return _files
}

export function clearPendingFiles() {
  _files = []
}

export function setPhotoUploadSession(session) {
  _photoUploadSession = session
    ? {
        files: session.files || [],
        results: session.results || null,
        skippedCount: session.skippedCount || 0,
      }
    : null
}

export function getPhotoUploadSession() {
  return _photoUploadSession
}

export function removePhotoUploadGroup(groupIndex) {
  if (!_photoUploadSession?.results) return null

  _photoUploadSession = {
    ..._photoUploadSession,
    results: _photoUploadSession.results
      .filter((group) => group.group_index !== groupIndex)
      .map((group, index) => ({ ...group, group_index: index })),
  }
  return _photoUploadSession
}

export function setPendingPhotoUploadGroup(group) {
  _photoUploadGroup = group || null
}

export function takePendingPhotoUploadGroup() {
  const group = _photoUploadGroup
  _photoUploadGroup = null
  return group
}

export function getPendingPhotoUploadGroup() {
  return _photoUploadGroup
}

export function clearPendingPhotoUploadGroup() {
  _photoUploadGroup = null
}
