// Activity 관련 API 함수 모음 — 사진 업로드 분석, 일정 확정
import axiosInstance from './axiosInstance'

// 사진 업로드 → EXIF 분석 → 그룹별 매칭 결과 반환 (DB 저장 없음)
export const uploadPhotos = async (files) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('photos', file))
  const response = await axiosInstance.post('/activity/upload-photos', formData)
  return response.data
}

// 일정 확정 → ActivityLog 생성 (Schedule → Completed 전환)
export const confirmSchedule = async (scheduleId, memo = null) => {
  const formData = new FormData()
  if (memo) formData.append('memo', memo)
  const response = await axiosInstance.post(`/activity/confirm/${scheduleId}`, formData)
  return response.data
}
