/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // 동적으로 조합되는 클래스가 purge되지 않도록 safelist 등록
  safelist: [
    'bg-blue-50',   'text-blue-600',
    'bg-purple-50', 'text-purple-600',
    'bg-green-50',  'text-green-600',
    'bg-orange-50', 'text-orange-600',
    'bg-pink-50',   'text-pink-600',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
