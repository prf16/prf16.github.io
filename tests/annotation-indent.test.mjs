import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { createMarkdown } from '@vuepress/markdown'
import { preserveAnnotationIndent } from '../docs/.vuepress/plugins/annotation-indent.mjs'

// Resolve the same plugin version that the installed theme actually uses.
const themeRequire = createRequire(import.meta.resolve('vuepress-theme-plume'))
const pluginPackage = pathToFileURL(themeRequire.resolve('vuepress-plugin-md-power/package.json'))
const { markdownPowerPlugin } = await import(new URL('./lib/node/index.js', pluginPackage))

async function createParser(fixed = true) {
  const md = createMarkdown()
  await markdownPowerPlugin({ annotation: true }).extendsMarkdown(md, { env: { isBuild: false } })
  if (fixed)
    preserveAnnotationIndent(md)
  return md
}

test('preserves three list levels with two-space, four-space and tab indentation', async () => {
  for (const indent of ['  ', '    ', '\t']) {
    const md = await createParser()
    const source = `正文 [+a]\n\n[+a]:\n${indent}- 父项\n${indent}${indent}- 子项\n${indent}${indent}${indent}- 孙项\n\n## 正文标题`
    const html = md.render(source, {})
    assert.match(html, /<li>父项\s*<ul>\s*<li>子项\s*<ul>\s*<li>孙项<\/li>/)
    assert.ok(html.indexOf('</Annotation>') < html.indexOf('正文标题'))
  }
})

test('preserves repeated definitions, inline content and reference rendering', async () => {
  const source = '注释 [+a]、再引用 [+a]\n\n[+a]: **第一条**\n\n[+a]:\n    第二条\n\n[+b]: 不相关\n\n正文结束'
  const fixed = (await createParser()).render(source, {})
  const original = (await createParser(false)).render(source, {})
  assert.equal(fixed, original)
  assert.match(fixed, /:total="2"/)
})

test('preserves blank lines, hard breaks and indented code within a list item', async () => {
  const md = await createParser()
  const source = '正文 [+a]\n\n[+a]:\n    - 父项\n\n        第一行  \n        第二行\n\n            const value = 1\n\n    - 同级项\n\n正文结束'
  const html = md.render(source, {})
  assert.match(html, /第一行<br>\n第二行/)
  assert.match(html, /<pre><code>  const value = 1\n<\/code><\/pre>/)
  assert.match(html, /<li>\s*<p>同级项<\/p>/)
})

test('leaves ordinary lists, links and malformed annotation labels unchanged', async () => {
  const source = '- 父项\n    - 子项\n\n[链接][url]\n\n[url]: https://example.com\n\n[+]: 空标签\n[+bad label]: 无效标签'
  assert.equal(
    (await createParser()).render(source, {}),
    (await createParser(false)).render(source, {}),
  )
})

test('renders the reading-note regression example with nested annotation lists', async () => {
  const source = '正文 [+8]\n\n[+8]:\n    译文\n    - `he walks about` 他走来走去\n        - 副词，简化版的介词\n    - `using his arms`\n        - `arms` 双臂'
  const md = await createParser()
  const env = {}
  md.render(source, env)
  const html = env.annotations[':8'].rendered[0]
  assert.match(html, /<li><code v-pre>he walks about<\/code> 他走来走去\s*<ul>\s*<li>副词，简化版的介词<\/li>/)
  assert.match(html, /<li><code v-pre>using his arms<\/code>\s*<ul>\s*<li><code v-pre>arms<\/code> 双臂<\/li>/)
})
