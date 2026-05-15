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
export const confirmSchedule = async (scheduleId, memo = null, photos = []) => {
  const formData = new FormData()
  if (memo) formData.append('memo', memo)
  photos.forEach((file) => formData.append('photos', file))
  const response = await axiosInstance.post(`/activity/confirm/${scheduleId}`, formData)
  return response.data
}

// 사진 EXIF와 일정 날짜/장소 비교 검증
export const verifyPhoto = async (scheduleId, file) => {
  const formData = new FormData()
  formData.append('photo', file)
  const response = await axiosInstance.post(`/activity/verify-photo/${scheduleId}`, formData)
  return response.data
}
