import React from "react";
import {
  Vector3,
  HemisphericLight,
  MeshBuilder,
  Scene,
  SceneLoader,
  ArcRotateCamera,
  Color3,
} from "@babylonjs/core";
import SceneComponent from "babylonjs-hook";
import "@babylonjs/loaders/glTF";

const modelTxHash = "aiBaieADG0YdqAOVWAfR_Jrv_wRsG3i51Snddh4EMi4";
const modelArweaveUrl = "https://arweave.net/" + modelTxHash;
const modelArweaveTransactionUrl =
  "https://viewblock.io/arweave/tx/" + modelTxHash;

const styles = {
  root: {
    width: "100%",
  },
  sceneHeaderWrapper: {
    maxWidth: "700px",
    padding: "5px",
    textAlign: "center" as const,
    margin: "0 auto",
  },
};

export default function MyLittleMetaVerse() {
  const onSceneReady = async (scene: Scene) => {
    scene.ambientColor = Color3.Magenta();

    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      3,
      new Vector3(0, 0, 0),
      scene
    );

    // This targets the camera to scene origin
    camera.setTarget(Vector3.Zero());

    const canvas = scene.getEngine().getRenderingCanvas();

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    SceneLoader.ShowLoadingScreen = false;
    const result = await SceneLoader.AppendAsync(
      "",
      modelArweaveUrl,
      scene,
      undefined,
      ".glb"
    );

    camera.zoomOn(result.meshes, true);

    // Our built-in 'ground' shape.
    MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
  };

  /**
   * Will run on every frame render.  We are spinning the box on y-axis.
   */
  const onRender = (_scene: Scene) => {};

  return (
    <div style={styles.root}>
      <div style={styles.sceneHeaderWrapper}>
        <p style={{ color: "gray", fontSize: "14px" }}>
          My Little Metaverse -{" "}
          <a
            href="https://www.artstation.com/artwork/1AGwX"
            target="_blank"
            rel="noopener"
          >
            Littlest Tokyo
          </a>
          , created by{" "}
          <a
            href="https://www.artstation.com/glenatron"
            target="_blank"
            rel="noopener"
          >
            Glen Fox
          </a>{" "}
          , CC Attribution.{" "}
        </p>
        <p style={{ color: "gray", fontSize: "14px" }}>
          <a href={modelArweaveTransactionUrl} target="_blank" rel="noopener">
            Store on Arweave
          </a>
        </p>
      </div>
      <SceneComponent
        antialias
        onSceneReady={onSceneReady}
        onRender={onRender}
        id="my-canvas"
        style={styles.root}
      />
    </div>
  );
}
