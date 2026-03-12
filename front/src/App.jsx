import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [result, setResult] = useState(null)

  const register = async () => {
    const response = await fetch('http://localhost:8000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "user93@example.com",
        password: "123",
        nick_name: "test",
        age: 25,
        gender: "man"})
    })
    console.log("상태코드:", response.status)  // 추가
    const data = await response.json()
    console.log("응답데이터:", data)  // 추가
    setResult(data)
  }
  return (
    <div>
      <button onClick={register}>연결 테스트</button>
      <p>{result ? JSON.stringify(result) : '응답 없음'}</p>
    </div>
  )
}
export default App
