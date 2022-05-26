# client

```sh
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
