# How to use

we provide two ways to use SealBlog.

## self-hosting blog

if you owns the code of your blog, simply adding the following line in the html of article page should be enough:

```js
<script src="https://cdn.jsdelivr.net/npm/@seal-blog/sdk@v0.6.0-rc1/bundle/unseal.min.js" rpc="https://api.sealblog.xyz/" client="https://sealblog.xyz"></script>
```

this way the decryption will happen all in your domain.

## external blog platform

you don't need to do anything. the decryption will redirect to SealBlog official homepage.
