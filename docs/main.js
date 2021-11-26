const salt = "R6gC78ro53bzKObYVqVRoxacVGziWecKjxoCXuOh"

const passBoxEl = document.getElementById('passbox')
const dogBoxEl = document.getElementById('dogbox')

const passFormEl = document.getElementById('passform')
const loadingEl = document.getElementById('loading-area')
const loadingFailedEl = document.getElementById('loading-failed')


async function doDoc() {
  passFormEl.classList.add('hidden')
  loadingEl.classList.remove('hidden')
  const pass = passBoxEl.value.replace(/(\r\n|\n|\r)/gm, "")
  const dog = dogBoxEl.value.replace(/(\r\n|\n|\r)/gm, "")
  const phrase = pass + '-' + dog.toLowerCase() + '-' + salt
  const hash = await sha256(phrase)
  const shortHash = hash.slice(0,16)
  // console.log(phrase)
  console.log(shortHash)

  await new Promise(resolve => setTimeout(resolve, 1000));
  let err = await loadDoc(phrase, shortHash)
  if (err) {
    loadingEl.classList.add('hidden')
    loadingFailedEl.classList.remove('hidden')
    console.log(err)
    return 
  }
  loadingEl.classList.add('hidden')
  
}

function reset() {
  passBoxEl.value = ''
  dogBoxEl.value = ''
  passFormEl.classList.remove('hidden')
  loadingFailedEl.classList.add('hidden')
}

async function loadDoc(pass, shortHash) {

  // let res1 = await fetch(`${shortHash}-doc.md.asc`)
  // let res2 = await fetch(`${shortHash}-pic1.png.b64.asc`)
  // let res3 = await fetch(`${shortHash}-pic2.png.b64.asc`)

  let res1 = await fetch(`doc.md.asc`)
  let res2 = await fetch(`pic1.png.b64.asc`)
  let res3 = await fetch(`pic2.png.b64.asc`)

  if (!(res1.ok && res2.ok && res3.ok)) {
    return Error('Unable to find encrypted docs, probably bad lookup id')
  }

  let doc = await res1.text()
  let pic1 = await res2.text()
  let pic2 = await res3.text()
  
  try {
    doc = await decrypt(doc, pass)
    pic1 = await decrypt(pic1, pass)
    pic2 = await decrypt(pic2, pass)
  } catch (error) {
    return Error('Unable to decrypt documents')
  }
  
  doc = doc.replace('(pic1.png)', `(data:image/png;base64,${pic1})`)
  doc = doc.replace('(pic2.png)', `(data:image/png;base64,${pic2})`)
  
  const converter = new showdown.Converter()
  const html = converter.makeHtml(doc)
  const mainEl = document.getElementById('main')
  mainEl.innerHTML = html
}


async function sha256(message) {
  const msgBuffer = new TextEncoder('ascii').encode(message);                    
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function decrypt(message, pass) {
  const encryptedMessage = await openpgp.readMessage({
    armoredMessage: message,
  });
  let { data : clearMessage } = await openpgp.decrypt({
    message: encryptedMessage,
    passwords: [pass],
    format: 'text',
  });
  
  return clearMessage
}

window.reset = reset
window.doDoc = doDoc
window.sha256 = sha256