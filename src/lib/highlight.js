// ---- small multi-language syntax highlighter ----
// Single left-to-right scan: comments, strings, numbers, keywords, and the
// name after def/class/function/... Anything else is escaped plain text.
const words = (s) => new Set(s.split(' '))

const KEYWORDS = {
  python: words(
    'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return self True try while with yield',
  ),
  clike: words(
    'abstract auto bool boolean break byte case catch char class const constexpr continue default defer delete do double else enum explicit export extends extern false final finally float fn for from func function go goto if impl implements import in inline instanceof int interface internal let long loop match mod mut namespace new nil null of operator override package private protected pub public range readonly return self Self short signed sizeof static struct super switch template this throw throws trait true try type typedef typeof undefined union unsigned use using val var virtual void volatile when where while yield async await',
  ),
  ruby: words(
    'alias and begin break case class def do else elsif end ensure false for if in module next nil not or redo rescue retry return self super then true undef unless until when while yield',
  ),
  sql: words(
    'select from where and or not insert into values update set delete create table join left right inner outer full cross on group by order having limit offset as distinct union all case when then else end null is in exists count sum avg min max with over partition rank dense_rank row_number between like asc desc if ifnull coalesce',
  ),
}

const SYNTAX = {
  python: {
    kw: 'python',
    line: '#',
    quotes: '\'"',
    triple: true,
  },
  ruby: {
    kw: 'ruby',
    line: '#',
    quotes: '\'"',
  },
  sql: {
    kw: 'sql',
    line: '--',
    block: ['/*', '*/'],
    quotes: '\'"',
    nocase: true,
  },
  other: {
    kw: null,
    quotes: '',
  },
}

const CLIKE = {
  kw: 'clike',
  line: '//',
  block: ['/*', '*/'],
  quotes: '\'"`',
}

const DEFINERS = words('def class function fn func struct interface trait enum')

const NUM = /\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[a-zA-Z]*/y

const WORD = /[A-Za-z_$][\w$]*/y

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function highlight(code, language) {
  const cfg = SYNTAX[language] || CLIKE
  const kw = cfg.kw ? KEYWORDS[cfg.kw] : null
  const n = code.length
  const tok = (cls, text) => '<span class="tok-' + cls + '">' + esc(text) + '</span>'
  let out = '',
    i = 0,
    plain = '',
    defining = false
  const flush = () => {
    if (plain) {
      out += esc(plain)
      plain = ''
    }
  }
  while (i < n) {
    const ch = code[i]
    if (cfg.line && code.startsWith(cfg.line, i)) {
      let j = code.indexOf('\n', i)
      if (j < 0) j = n
      flush()
      out += tok('com', code.slice(i, j))
      i = j
      continue
    }
    if (cfg.block && code.startsWith(cfg.block[0], i)) {
      let j = code.indexOf(cfg.block[1], i + cfg.block[0].length)
      j = j < 0 ? n : j + cfg.block[1].length
      flush()
      out += tok('com', code.slice(i, j))
      i = j
      continue
    }
    if (cfg.quotes.includes(ch)) {
      let j
      if (cfg.triple && code.startsWith(ch + ch + ch, i)) {
        j = code.indexOf(ch + ch + ch, i + 3)
        j = j < 0 ? n : j + 3
      } else {
        j = i + 1
        while (j < n && code[j] !== ch && (ch === '`' || code[j] !== '\n')) {
          if (code[j] === '\\') j++
          j++
        }
        j = Math.min(n, j + 1)
      }
      flush()
      out += tok('str', code.slice(i, j))
      i = j
      continue
    }
    if (kw && /[0-9]/.test(ch) && !/[\w$]/.test(code[i - 1] || '')) {
      NUM.lastIndex = i
      const m = NUM.exec(code)
      flush()
      out += tok('num', m[0])
      i += m[0].length
      continue
    }
    if (kw && /[A-Za-z_$]/.test(ch)) {
      WORD.lastIndex = i
      const w = WORD.exec(code)[0]
      const key = cfg.nocase ? w.toLowerCase() : w
      flush()
      if (kw.has(key)) {
        out += tok('kw', w)
        defining = DEFINERS.has(key)
      } else if (defining) {
        out += tok('def', w)
        defining = false
      } else out += esc(w)
      i += w.length
      continue
    }
    if (!/\s/.test(ch)) defining = false
    plain += ch
    i++
  }
  flush()
  return out
}
