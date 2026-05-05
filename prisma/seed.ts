import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터 삽입 시작...')

  // 기본 카테고리
  const categories = [
    { name: '회비 입금',  color: '#22C55E', isDefault: true },
    { name: '식비',       color: '#F97316', isDefault: true },
    { name: '경조사',     color: '#A855F7', isDefault: true },
    { name: '교통/숙박',  color: '#3B82F6', isDefault: true },
    { name: '기타 지출',  color: '#6B7280', isDefault: true },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: categories.indexOf(cat) + 1 },
      update: {},
      create: cat,
    })
  }
  console.log('✅ 카테고리 생성 완료')

  // 기본 설정값
  const settings = [
    { key: 'group_start_date',   value: '2022-11-01' },
    { key: 'monthly_fee_amount', value: '30000' },
    { key: 'fee_day_option_1',   value: '1' },
    { key: 'fee_day_option_2',   value: '25' },
    { key: 'group_name',         value: '우리 가족 계모임' },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }
  console.log('✅ 기본 설정값 저장 완료')

  // ⚠️ 멤버는 직접 추가 필요 — 아래 예시를 실제 이름으로 수정 후 사용
  // const members = [
  //   { name: '홍길동', nickname: '길동', monthlyFee: 30000, joinDate: new Date('2022-11-01') },
  //   { name: '김영희', nickname: '영희', monthlyFee: 30000, joinDate: new Date('2022-11-01') },
  // ]
  // for (const m of members) {
  //   await prisma.member.create({ data: m })
  // }

  console.log('🎉 시드 완료!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
