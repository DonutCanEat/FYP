# Sample FYP Proposal: Markdown to Word Conversion Test

This is the title page paragraph. It exercises body text, **bold**, *italic*, ***bold italic***, `inline code`, and a soft
line break inside one paragraph. Special characters must survive XML escaping: AT&T, 5 < 6, 7 > 4, quote " and ampersand &,
plus a backslash \\ and a pipe |. Unicode: α, β, ≤, ≥, ×, —, …, café, 研究, ✓.

[TOC]

---

## 1 Introduction

This section verifies that a level two heading appears in Word's navigation pane and in an updatable table of
contents. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. The quick brown fox
jumps over the lazy dog.

### 1.1 Background and Motivation

Nested heading level three. Inline emphasis tests follow: **bold text here**, *italic text here*, `code_span_with_*stars*`,
and a [link to an external site](https://example.com/path?q=1&r=2) plus an autolink <https://example.org>.

#### 1.1.1 Deeper Sub-subsection

Heading level four must map to the built-in Heading 4 style. More filler: the quick brown fox.

### 1.2 Objectives

1. Objective one: build the converter.
2. Objective two: validate the output rigorously.
3. Objective three: survive a 60,000 word input.

## 2 Literature Review

Two level-two headings in a row, with body text between, so that a heading is never directly followed by another
heading at the same level (which can confuse some TOC generators).

> This is a block quote. It demonstrates the quoted style, which is indented with a left bar and rendered in italics.
> A second consecutive line continues the same quotation block.
>
> A new quoted paragraph after a blank quote line.

> A block quote containing **bold** and *italic* inline runs and `code`.

## 3 Methodology

### 3.1 Unordered Lists

- First level bullet with **bold** text.
- Second bullet at level one.
  - Nested bullet at level two.
  - Another nested bullet with *italic* text.
    - Nested bullet at level three for good measure.
- Back to level one.

* An asterisk-style bullet.
+ A plus-style bullet.

### 3.2 Ordered Lists

1. First numbered item.
2. Second numbered item.
   1. Nested ordered item at level two.
   2. Another nested ordered item.
      1. Nested ordered item at level three.
3. Third numbered item with `inline code`.
4. Fourth numbered item.

### 3.3 Task List

- [ ] Unchecked task item.
- [x] Checked task item parsed into a marked bullet.

### 3.4 Tables

Table 3.1 compares the three candidate toolchains.

| Toolchain | Runs here | Table support | Verdict |
| --- | :---: | --- | --- |
| pandoc | No (exit 9009) | Excellent | Unusable |
| LibreOffice headless | No | Good | Unusable |
| Node + OOXML writer | Yes | Implemented here | **Selected** |

A second table with alignment and escaped pipes:

| Requirement | Status | Notes |
|:------------|:------:|------:|
| H2/H3 headings | Done | built-in styles |
| Code blocks | Done | grey shading |
| Wide column with a very long cell to force Word to wrap text inside the table cell rather than overflowing the page margin | Done | wrapping |

### 3.4.1 Table pipes: escaped and inside code spans

Both patterns below occur in the real proposal corpus and would previously mis-split a row
into the wrong number of columns. Every data row in these two tables must produce
**exactly 4 cells** in the .docx.

| Pattern | Cell count | Rendered value | Notes |
| --- | --- | --- | --- |
| Escaped pipe | 4 | `DL-{Share}-{RW\|RO}` | `\|` is a literal pipe, never a separator |
| Pipe inside a code span | 4 | `a\|b` | escaping wins, and the pipe stays content |
| Braces with pipes | 4 | Member `{A\|B\|C\|D}` | several pipes inside one code span |
| Awk command with pipes | 4 | `awk -F: '{print \$1}' /etc/shadow` | real corpus line 06-automation.md:1129 |

A cell that legitimately contains several pipes, using a real command shape:

| Command | Purpose | Hosts | Verdict |
| --- | --- | --- | --- |
| `nft list ruleset \| grep -c 'policy drop'` | count drop policies | `vpnz-nft01` | expected |
| `ip -br link \| awk '$2=="UP"{print $1}'` | list up interfaces | `vpnz-lnxra01` | expected |
| `Get-ADUser -Filter * \| Measure-Object` | count accounts | `vpnz-dc01` | informational |

A deliberately ragged row (five cells supplied where the header declares four). The
converter pads or truncates it to keep the Word table rectangular. Because the directive
below declares this table as intentionally ragged, the row is not reported; without the
directive it would appear in `raggedTableRows`:

<!-- md2docx:expect-ragged -->
| Ragged | Pad test | Extra | Note |
| --- | --- | --- | --- |
| one | two | three | four | this fifth cell is truncated and reported |

### 3.5 Code Samples

```js
// JavaScript sample: quotes " and ' must NOT be converted to smart quotes.
function add(a, b) {
  if (a > b && b < 1) { return `sum=${a + b}`; }
  return a + b;
}
```

```python
# Python sample with a tab and special characters
def scale(x, factor=2.0):
    return x * factor  # naïve café note: 研究
```

```
A fenced block with no language tag at all.
Line two of the same block.   Trailing spaces preserved.
```

### 3.6 Figures and Diagrams

[FIGURE: System architecture — browser -> API gateway -> parser -> OOXML writer -> .docx]

[FIGURE: Data flow diagram showing the Markdown token stream entering the inline-run builder, then the block writer, then the ZIP packager]

---

## 4 Results and Discussion

The horizontal rule above must render as a paragraph border. Below, a paragraph containing an ampersand & and a
less-than sign < and a greater-than sign >, plus "double quotes" and 'single quotes' that must stay straight.

### 4.1 Summary Table

| Metric | Value |
| --- | --- |
| Words | 1,234 |
| Tables | 3 |
| Code blocks | 3 |

## 5 Conclusion

Final body paragraph at the end of the sample document, so that truncation of the tail would be detectable.
