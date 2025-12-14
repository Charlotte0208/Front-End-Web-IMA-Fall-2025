function countAllParagraphs() {
  const count = document.querySelectorAll("p").length
  document.getElementById("outputTotal").textContent = `There are ${count} paragraph tags on this page.`
}

function countInsideFirstId() {
  const container = document.getElementById("groupOne")
  const count = container.children.length
  document.getElementById("outputGroupOne").textContent = `There are ${count} elements inside #groupOne.`
}

function countInsideSecondId() {
  const container = document.getElementById("groupTwo")
  const count = container.children.length
  document.getElementById("outputGroupTwo").textContent = `There are ${count} elements inside #groupTwo.`
}

document.getElementById("btnTotal").addEventListener("click", countAllParagraphs)
document.getElementById("btnGroupOne").addEventListener("click", countInsideFirstId)
document.getElementById("btnGroupTwo").addEventListener("click", countInsideSecondId)
