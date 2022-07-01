import test from "ava";
import {
  SEAL_CONTENT_MATCH_REGEX,
  SPLITTER_HTML_REGEX,
  SPLITTER_REGEX,
} from "../src/regex";

test("blogger", async (t) => {
  global.document = {
    body: {} as any,
  } as any;

  document.body.innerText =
    "Skip to main content\n@seal-blog/dev\n\nAreopagitica [1890]: A Speech of Mr. John Milton: For the Liberty of Unlicensed Printing, to the Parliament of England\nJune 04, 2022\n\nhello\n\n······click here to read encrypted content. Power By SealBlog·······\n\nvfH T8e xYD AyS KKf LXc sMn A==\n\n······click here to read encrypted content. Power By SealBlog·······\n\nComments\n Powered by Blogger\nTheme images by Michael Elkan\nSEALBLOG\nVISIT PROFILE\nArchive\nReport Abuse";

  document.body.innerHTML = `<div class="post-body entry-content float-container" id="post-body-2093102714269477674">
  <p style="-webkit-text-stroke-width: 0px; color: black; font-family: Times; font-size: medium; font-style: normal; font-variant-caps: normal; font-variant-ligatures: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-decoration-color: initial; text-decoration-style: initial; text-decoration-thickness: initial; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px;">hello</p><p style="-webkit-text-stroke-width: 0px; color: black; font-family: Times; font-size: medium; font-style: normal; font-variant-caps: normal; font-variant-ligatures: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-decoration-color: initial; text-decoration-style: initial; text-decoration-thickness: initial; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px;">······click<span>&nbsp;</span><a href="https://sealblog.xyz/unseal?version=0.1.0&amp;postId=0x00000000000116e94586d13e27f2f6b64a7103e8864753cd1e6176b785a9e49d645b5cf8bc260a710696179a78266ed2">here</a><span>&nbsp;</span>to read encrypted content. Power By<span>&nbsp;</span><a href="https://markdowntohtml.com/">SealBlog</a>·······</p><p style="-webkit-text-stroke-width: 0px; color: black; font-family: Times; font-size: medium; font-style: normal; font-variant-caps: normal; font-variant-ligatures: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-decoration-color: initial; text-decoration-style: initial; text-decoration-thickness: initial; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px;">vfH T8e xYD AyS KKf LXc sMn A==</p><p style="-webkit-text-stroke-width: 0px; color: black; font-family: Times; font-size: medium; font-style: normal; font-variant-caps: normal; font-variant-ligatures: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-decoration-color: initial; text-decoration-style: initial; text-decoration-thickness: initial; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px;">······click<span>&nbsp;</span><a href="https://sealblog.xyz/unseal?version=0.1.0&amp;postId=0x00000000000116e94586d13e27f2f6b64a7103e8864753cd1e6176b785a9e49d645b5cf8bc260a710696179a78266ed2">here</a><span>&nbsp;</span>to read encrypted content. Power By<span>&nbsp;</span><a href="https://markdowntohtml.com/">SealBlog</a>·······</p>
  </div>`;

  {
    const match = document.body.innerHTML.match(SPLITTER_HTML_REGEX);
    t.true(match != null);
  }

  {
    const match = document.body.innerText.match(SEAL_CONTENT_MATCH_REGEX);
    t.true(match != null);
  }

  {
    const s = document.body.innerText.match(SEAL_CONTENT_MATCH_REGEX);
    if (!s || s.length <= 0) return t.fail("s.length is 0");

    const match = s[0].split(SPLITTER_REGEX)[1]?.replace(/\s/g, "");
    const expectStr = "vfHT8exYDAySKKfLXcsMnA==";
    t.is(match, expectStr);
  }
});
