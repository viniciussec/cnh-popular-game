const loadedAssets = new Set();

export async function loadAssets(scene, assets) {
  const newAssets = assets.filter(a => !loadedAssets.has(a.key));

  if (newAssets.length === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    newAssets.forEach((asset) => {
      switch (asset.type) {
        case "image":
          scene.load.image(asset.key, asset.path);
          break;
        case "audio":
          scene.load.audio(asset.key, asset.path);
          break;
        case "spritesheet":
          scene.load.spritesheet(asset.key, asset.path, asset.config);
          break;
        default:
          console.warn(`Tipo de asset desconhecido: ${asset.type}`);
      }

      loadedAssets.add(asset.key);
    });

    scene.load.once(Phaser.Loader.Events.COMPLETE, resolve);
    scene.load.start();
  });
}
