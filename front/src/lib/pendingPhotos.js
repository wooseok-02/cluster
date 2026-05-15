// SPA 내비게이션 중 File 객체를 잃지 않기 위한 모듈 레벨 임시 저장소
// File 객체는 JSON 직렬화 불가, history state 크기 제한 초과 → navigate state 사용 불가
let _files = []

export function setPendingFiles(files) {
  _files = files
}

export function takePendingFiles() {
  const files = _files
  _files = []
  return files
}
