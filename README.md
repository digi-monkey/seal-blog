seal-blog
===

one line javascript code to make your web2 blog WEB3.

turn your personal blog post encrypted and only readable with NFT membership token holder. the NFT is lived on Godwoken blockchain, the layer2 rollup of ckb network.

How to run
---

start server:

```sh
$ cat > ./packages/server/.env <<EOF
PORT=<your api server listen port>
BLOCKCHAIN_NETWORK=<"devnet", "testnet" or "mainnet">
EOF
```

```sh
yarn workspace @seal-blog/server web
```

start client:

````sh
$ cat > ./.env <<EOF
PORT=<"UI port">
EOF
```

change your config at `src/api/env-config.ts`:

```sh
export const envConfig = {
  mode: "production",
  networkType: "testnet",
  blogTitle: "Web3 Blog",
  blogDescription: "Web3 Blog",
};
```

```sh
yarn workspace @seal-blog/client start
```
