module.exports = {
  root: true,
  extends: [require.resolve('@rtbunker/config/eslint.base.cjs')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['.medusa', 'dist', 'build'],
}
