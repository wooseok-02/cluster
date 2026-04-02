from app.people.extract_embedding import extract_embedding

def test_extract_embedding() :
    with open("test.jpg", 'rb') as f :
        photo_byte = f.read() #이건 바이트 형태로 사진을 변환

    embedding = extract_embedding(photo_byte)

    print("임베딩 추출 성공")
    print("bytes 길이:", len(embedding))  # 1024 나오면 정상 (128 float * 8 bytes)

