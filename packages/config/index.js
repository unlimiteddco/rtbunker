/** Helpers para resolver paths a los presets desde otras apps. */
const path = require('node:path')

module.exports = {
  tsconfigBase: path.join(__dirname, 'tsconfig.base.json'),
  tsconfigNext: path.join(__dirname, 'tsconfig.next.json'),
  tsconfigMedusa: path.join(__dirname, 'tsconfig.medusa.json'),
  eslintBase: path.join(__dirname, 'eslint.base.cjs'),
  tailwindBase: path.join(__dirname, 'tailwind.base.cjs'),
}
