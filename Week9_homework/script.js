class CoffeeCard extends HTMLElement {
  constructor(drink, roast, size, milk, sweet) {
    super()
    this.drink = drink ?? this.getAttribute("drink")
    this.roast = roast ?? this.getAttribute("roast")
    this.size = size ?? this.getAttribute("size")
    this.milk = milk ?? this.getAttribute("milk")
    this.sweet = sweet ?? this.getAttribute("sweet")

    this.render()
  }

  render() {
    this.innerHTML = `
      <div class="tag">${this.roast} roast</div>
      <h3 class="cTitle">${this.drink}</h3>
      <p class="meta">Size: ${this.size}</p>
      <p class="meta">Milk: ${this.milk}</p>
      <p class="meta">Sweetness: ${this.sweet}</p>
      <div class="cardActions">
        <button class="smallBtn" type="button">Brew</button>
        <button class="smallBtn" type="button">Remove</button>
      </div>
    `
    const btns = this.querySelectorAll("button")
    btns[0].addEventListener("click", () => this.brew())
    btns[1].addEventListener("click", () => this.removeCard())
  }

  brew() {
    updateStatus(`Brewing ${this.drink}...`)
    setTimeout(() => updateStatus(`${this.drink} is ready.`), 500)
  }

  removeCard() {
    this.remove()
    updateSummary()
    updateStatus("Removed one card.")
  }
}

customElements.define("coffee-card", CoffeeCard)

function updateStatus(message) {
  document.getElementById("status").textContent = message
}

function updateSummary() {
  const total = document.querySelectorAll("coffee-card").length
  const filter = document.getElementById("filterRoast").value
  document.getElementById("summary").textContent = `Cards on board: ${total}. Current filter: ${filter}.`
}

function applyFilter() {
  const filter = document.getElementById("filterRoast").value
  const cards = document.querySelectorAll("coffee-card")
  cards.forEach(card => {
    const roast = card.getAttribute("roast")
    card.style.display = filter === "all" || roast === filter ? "block" : "none"
  })
  updateSummary()
  updateStatus("Filter applied.")
}

document.getElementById("sweet").addEventListener("input", (e) => {
  document.getElementById("sweetHint").textContent = `Sweetness: ${e.target.value}`
})

document.getElementById("drinkForm").addEventListener("submit", (e) => {
  e.preventDefault()
  const drink = document.getElementById("drinkName").value.trim()
  const roast = document.getElementById("roast").value
  const size = document.getElementById("size").value
  const milk = document.getElementById("milk").value
  const sweet = document.getElementById("sweet").value

  if (!drink) return

  const card = new CoffeeCard(drink, roast, size, milk, sweet)
  card.setAttribute("drink", drink)
  card.setAttribute("roast", roast)
  card.setAttribute("size", size)
  card.setAttribute("milk", milk)
  card.setAttribute("sweet", sweet)

  document.getElementById("cards").append(card)
  document.getElementById("drinkForm").reset()
  document.getElementById("sweetHint").textContent = "Sweetness: 2"
  updateSummary()
  updateStatus(`${drink} added to the board.`)
})

document.getElementById("filterRoast").addEventListener("change", applyFilter)

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("cards").innerHTML = ""
  updateSummary()
  updateStatus("Board cleared.")
})

updateSummary()
