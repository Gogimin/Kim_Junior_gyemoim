# 로컬 개발 환경 세팅 가이드

## 1. 패키지 설치

```bash
npm install
```

## 2. PostgreSQL DB 생성

PostgreSQL에 접속해서 DB를 만든다.

```sql
CREATE DATABASE gye_moim;
```

## 3. .env 파일 수정

`.env` 파일을 열고 아래 값을 수정한다.

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/gye_moim"
ACCESS_KEY="가족이_쓸_비밀번호"
SESSION_SECRET="랜덤_문자열_32자_이상"
```

SESSION_SECRET 생성 방법 (터미널):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Prisma 마이그레이션 (DB 테이블 생성)

```bash
npm run db:migrate
# 마이그레이션 이름 입력: init
```

## 5. Prisma Client 생성

```bash
npm run db:generate
```

## 6. 시드 데이터 삽입 (기본 카테고리 등)

```bash
npm run db:seed
```

## 7. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속
→ .env에 설정한 ACCESS_KEY 입력
→ 대시보드 진입 확인

## 8. DB 연결 확인

```
http://localhost:3000/api/health
```
→ `{"status":"ok","db":"connected"}` 응답이 오면 정상

---

## 폴더 구조

```
├── prisma/
│   ├── schema.prisma     # DB 스키마
│   └── seed.ts           # 초기 데이터
├── src/
│   ├── app/
│   │   ├── api/          # API 라우트 (백엔드)
│   │   ├── dashboard/    # 대시보드 페이지
│   │   ├── layout.tsx
│   │   └── page.tsx      # 로그인 페이지
│   ├── lib/
│   │   ├── prisma.ts     # DB 클라이언트
│   │   └── auth.ts       # 인증 유틸
│   └── middleware.ts     # 인증 미들웨어
├── .env                  # 환경변수 (git에 올리지 말 것)
└── package.json
```
