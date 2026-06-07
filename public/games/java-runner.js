const configElement = document.getElementById('java-game-config');
const statusElement = document.getElementById('game-status');
const displayRoot = document.getElementById('cheerpj-display');

const config = JSON.parse(configElement.textContent);

function setStatus(message) {
  if (statusElement) {
    statusElement.textContent = message;
  }
}

async function bootGame() {
  if (typeof cheerpjInit !== 'function') {
    throw new Error('CheerpJ runtime did not load');
  }

  setStatus('loading java runtime');
  await cheerpjInit({
    version: 8,
    status: 'splash',
    javaProperties: [`user.dir=${config.userDir}`, 'portfolio.cheerpj=true'],
  });

  if (
    typeof cheerpjCreateDisplay !== 'function' ||
    typeof cheerpjRunMain !== 'function'
  ) {
    throw new Error('CheerpJ runtime API did not initialize');
  }

  setStatus('starting game');
  cheerpjCreateDisplay(-1, -1, displayRoot);
  const exitCode = cheerpjRunMain(config.mainClass, config.classPath);
  setStatus('');
  await exitCode;
}

bootGame()
  .then(() => setStatus('game closed'))
  .catch((error) => {
    console.error(error);
    setStatus(`could not start game: ${error.message}`);
    document.body.classList.add('has-error');
  });
