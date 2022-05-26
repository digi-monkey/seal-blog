import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Intro } from "./components/nft/Intro";
import { Unseal } from "./components/dashboard/Unseal";
import { TestJs } from "./components/test/TestJs";
import { Write } from "./components/dashboard/Write";
import { User } from "./components/dashboard/User";

export default function MyRouter() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/user">
          <User />
        </Route>
        <Route path="/write">
          <Write />
        </Route>
        <Route path="/unseal">
          <Unseal />
        </Route>
        <Route path="/js">
          <TestJs />
        </Route>
        <Route path="/nft">
          <Intro />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}
