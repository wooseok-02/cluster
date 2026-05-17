import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { registerPerson } from '../api/people'

const inputClassName =
  'h-10 w-full rounded-[10px] border border-gray-300 bg-white !px-[10px] text-xs leading-4 text-text-main placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10'

export default function PersonRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const [form, setForm] = useState({
    name: '',
    age: '',
    relation: '',
    address: '',
    phone: '',
  })
  const [preview, setPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerPerson({ ...form, age: Number(form.age), photo: photoFile })
      navigate(from === 'schedule' ? '/schedule/create' : '/people')
    } catch (err) {
      setError(err.response?.data?.detail || '등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[448px] flex-col bg-white !px-[30px] !pt-5 !pb-[35px]">
      <header className="relative flex h-[30px] shrink-0 items-center justify-center">
        <button
          type="button"
          onClick={() => navigate(from === 'schedule' ? '/schedule/create' : '/people')}
          className="absolute left-0 flex h-[30px] w-[30px] items-center justify-center text-black"
          aria-label="Go back"
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <path d="M18.75 22.5L11.25 15L18.75 7.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-center text-base font-semibold leading-4 text-black">새로운 사람 추가</h2>
      </header>

      <main className="flex flex-1 flex-col">
        <label className="!mx-auto !mt-[43px] flex h-[130px] w-[130px] cursor-pointer flex-col items-center justify-center gap-[5px] overflow-hidden rounded-full bg-primary-light text-primary">
          <span className="sr-only">사진 추가</span>
          <span className="flex h-full w-full flex-col items-center justify-center gap-[5px]">
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 8.5C4 7.39543 4.89543 6.5 6 6.5H8.65L10.15 4.5H13.85L15.35 6.5H18C19.1046 6.5 20 7.39543 20 8.5V17.5C20 18.6046 19.1046 19.5 18 19.5H6C4.89543 19.5 4 18.6046 4 17.5V8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M12 16.25C13.7949 16.25 15.25 14.7949 15.25 13C15.25 11.2051 13.7949 9.75 12 9.75C10.2051 9.75 8.75 11.2051 8.75 13C8.75 14.7949 10.2051 16.25 12 16.25Z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span className="text-sm leading-4 text-primary">사진 추가</span>
              </>
            )}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </label>

        <form onSubmit={handleSubmit} className="!mt-[46px] flex w-full flex-1 flex-col">
          <div className="flex flex-col gap-[10px]">
            <label className="text-sm font-medium leading-4 text-black">이름</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름을 입력해주세요."
              className={inputClassName}
              required
            />
          </div>

          <div className="!mt-[25px] flex flex-col gap-[10px]">
            <label className="text-sm font-medium leading-4 text-black">나이</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              placeholder="나이를 입력해주세요."
              className={inputClassName}
              required
            />
          </div>

          <div className="!mt-[25px] flex flex-col gap-[10px]">
            <label className="text-sm font-medium leading-4 text-black">관계</label>
            <input
              type="text"
              name="relation"
              value={form.relation}
              onChange={handleChange}
              placeholder="예) 가족, 친구, 직장동료 등"
              className={inputClassName}
              required
            />
          </div>

          <div className="!mt-[25px] flex flex-col gap-[10px]">
            <label className="text-sm font-medium leading-4 text-black">주소</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="예) 서울시 강남구"
              className={inputClassName}
            />
          </div>

          <div className="!mt-[25px] flex flex-col gap-[10px]">
            <label className="text-sm font-medium leading-4 text-black">전화번호</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="예) 010-1234-5678"
              className={inputClassName}
            />
          </div>

          {error && <p className="!mt-4 text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="!mt-14 flex h-[46px] w-full items-center justify-center rounded-[10px] bg-primary text-base font-semibold leading-4 text-white transition-opacity disabled:opacity-50"
          >
            {loading ? '등록 중...' : '등록'}
          </button>
        </form>
      </main>
    </div>
  )
}
