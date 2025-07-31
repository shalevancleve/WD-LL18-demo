// --- DOM elements ---
const randomBtn = document.getElementById("random-btn");
const recipeDisplay = document.getElementById("recipe-display");
const remixBtn = document.getElementById("remix-btn");
const themeSelect = document.getElementById("remix-theme");
const remixOutput = document.getElementById("remix-output");
const savedRecipesContainer = document.getElementById("saved-recipes-container");
const savedRecipesList = document.getElementById("saved-recipes-list");

// --- AI remix saved recipes DOM ---
let savedRemixContainer = document.getElementById("saved-remix-container");
let savedRemixList = document.getElementById("saved-remix-list");

// If not present, create the AI remix container and list
if (!savedRemixContainer) {
  savedRemixContainer = document.createElement("div");
  savedRemixContainer.id = "saved-remix-container";
  savedRemixContainer.style.display = "none";
  savedRemixContainer.innerHTML = `
    <h3>Saved AI Remixes</h3>
    <ul id="saved-remix-list"></ul>
  `;
  // Insert below savedRecipesContainer
  savedRecipesContainer.parentNode.insertBefore(
    savedRemixContainer,
    savedRecipesContainer.nextSibling
  );
  savedRemixList = document.getElementById("saved-remix-list");
}

// --- AI remix localStorage helpers ---
function getSavedRemixes() {
  const saved = localStorage.getItem("savedRemixRecipes");
  return saved ? JSON.parse(saved) : [];
}
function setSavedRemixes(remixes) {
  localStorage.setItem("savedRemixRecipes", JSON.stringify(remixes));
}

// --- Render AI remix list ---
function renderSavedRemixList() {
  const remixes = getSavedRemixes();
  if (remixes.length === 0) {
    savedRemixContainer.style.display = "none";
    savedRemixList.innerHTML = "";
    return;
  }
  savedRemixContainer.style.display = "block";
  // Give remix items the same class as saved recipe items for styling
  savedRemixList.innerHTML = remixes
    .map(
      (remix) =>
        `<li class="saved-recipe-item">
          <span>${remix.name}</span>
          <button class="delete-btn" data-name="${remix.name}">Delete</button>
        </li>`
    )
    .join("");
  // Click to load recipe and remix
  const items = savedRemixList.querySelectorAll(".saved-recipe-item span");
  items.forEach((item) => {
    item.addEventListener("click", async function () {
      const recipeName = item.textContent;
      // Find remix text
      const remixObj = remixes.find((r) => r.name === recipeName);
      // Fetch recipe by name from MealDB API
      try {
        recipeDisplay.innerHTML = "<p>Loading saved recipe...</p>";
        remixOutput.textContent = "";
        remixOutput.style.display = "none";
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(recipeName)}`
        );
        const data = await res.json();
        if (data.meals && data.meals.length > 0) {
          renderRecipe(data.meals[0]);
          // Show the saved remix output
          remixOutput.textContent = remixObj.remix;
          remixOutput.style.display = "block";
        } else {
          recipeDisplay.innerHTML = "<p>Sorry, couldn't find that recipe.</p>";
        }
      } catch (error) {
        recipeDisplay.innerHTML = "<p>Sorry, couldn't load that recipe.</p>";
      }
    });
  });
  // Delete button for remix
  const deleteBtns = savedRemixList.querySelectorAll(".delete-btn");
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const nameToDelete = btn.getAttribute("data-name");
      let remixes = getSavedRemixes();
      remixes = remixes.filter((r) => r.name !== nameToDelete);
      setSavedRemixes(remixes);
      renderSavedRemixList();
    });
  });
}

// Helper: Get saved recipe names from localStorage
function getSavedRecipeNames() {
  const saved = localStorage.getItem("savedRecipeNames");
  return saved ? JSON.parse(saved) : [];
}

// Helper: Save recipe names to localStorage
function setSavedRecipeNames(names) {
  localStorage.setItem("savedRecipeNames", JSON.stringify(names));
}

// Show saved recipes list above the main recipe
function renderSavedRecipesList() {
  const names = getSavedRecipeNames();
  if (names.length === 0) {
    savedRecipesContainer.style.display = "none";
    savedRecipesList.innerHTML = "";
    return;
  }
  savedRecipesContainer.style.display = "block";
  savedRecipesList.innerHTML = names
    .map(
      (name) => `
      <li class="saved-recipe-item">
        <span>${name}</span>
        <button class="delete-btn" data-name="${name}">Delete</button>
      </li>
    `
    )
    .join("");
  // Add click event to each saved recipe name
  const items = savedRecipesList.querySelectorAll(".saved-recipe-item span");
  items.forEach((item) => {
    item.addEventListener("click", async function () {
      const recipeName = item.textContent;
      // Fetch recipe by name from MealDB API
      try {
        recipeDisplay.innerHTML = "<p>Loading saved recipe...</p>";
        remixOutput.textContent = "";
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(recipeName)}`
        );
        const data = await res.json();
        if (data.meals && data.meals.length > 0) {
          renderRecipe(data.meals[0]);
        } else {
          recipeDisplay.innerHTML = "<p>Sorry, couldn't find that recipe.</p>";
        }
      } catch (error) {
        recipeDisplay.innerHTML = "<p>Sorry, couldn't load that recipe.</p>";
      }
    });
  });
  // Add click event to each delete button
  const deleteBtns = savedRecipesList.querySelectorAll(".delete-btn");
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevent triggering recipe load
      const nameToDelete = btn.getAttribute("data-name");
      let names = getSavedRecipeNames();
      names = names.filter((n) => n !== nameToDelete);
      setSavedRecipeNames(names);
      renderSavedRecipesList();
    });
  });
}

// This function creates a list of ingredients for the recipe from the API data
// It loops through the ingredients and measures, up to 20, and returns an HTML string
// that can be used to display them in a list format
// If an ingredient is empty or just whitespace, it skips that item
function getIngredientsHtml(recipe) {
  let html = "";
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const meas = recipe[`strMeasure${i}`];
    if (ing && ing.trim()) html += `<li>${meas ? `${meas} ` : ""}${ing}</li>`;
  }
  return html;
}

// This function displays the recipe on the page
function renderRecipe(recipe) {
  currentRecipe = recipe; // Save recipe for remixing
  recipeDisplay.innerHTML = `
    <div class="recipe-title-row">
      <h2>${recipe.strMeal}</h2>
    </div>
    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" />
    <h3>Ingredients:</h3>
    <ul>${getIngredientsHtml(recipe)}</ul>
    <h3>Instructions:</h3>
    <p>${recipe.strInstructions.replace(/\r?\n/g, "<br>")}</p>
    <button id="save-recipe-btn" class="save-inline-btn">Save Recipe</button>
  `;
  remixOutput.textContent = ""; // Clear previous remix
  remixOutput.style.display = "none"; // Hide remix box when empty

  // Save Recipe button
  const saveBtn = document.getElementById("save-recipe-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      if (!currentRecipe || !currentRecipe.strMeal) return;
      let names = getSavedRecipeNames();
      if (!names.includes(currentRecipe.strMeal)) {
        names.push(currentRecipe.strMeal);
        setSavedRecipeNames(names);
        renderSavedRecipesList();
      }
    });
  }
}

// This function gets a random recipe from the API and shows it
async function fetchAndDisplayRandomRecipe() {
  recipeDisplay.innerHTML = "<p>Loading...</p>"; // Show loading message
  remixOutput.textContent = ""; // Clear previous remix
  try {
    let apiUrl = "https://www.themealdb.com/api/json/v1/1/random.php";
    // Fetch a random recipe from the MealDB API
    const res = await fetch(apiUrl); // Replace with the actual API URL
    const data = await res.json(); // Parse the JSON response
    const recipe = data.meals[0]; // Get the first recipe from the response

    renderRecipe(recipe); // Render the recipe on the page
  } catch (error) {
    recipeDisplay.innerHTML = "<p>Sorry, couldn't load a recipe.</p>";
  }
}

// --- Remix function using OpenAI ---
async function remixRecipeWithAI() {
  // Show a friendly loading message in the remix box
  remixOutput.textContent =
    "✨ Hang tight! Your remixed recipe is being prepared by our AI chef... 🍳";
  remixOutput.style.display = "block"; // Show remix box when loading
  // Get the selected remix theme
  const theme = themeSelect.value;
  // Prepare the prompt for OpenAI
  const prompt = `
You are a creative chef. Remix the following recipe with the theme "${theme}".
Give a short, fun, and doable version. Highlight any changed ingredients or instructions.
Recipe JSON:
${JSON.stringify(currentRecipe, null, 2)}
`;

  try {
    // Get your OpenAI API key from secrets.js
    // (students: put your key in secrets.js as: window.OPENAI_API_KEY = "your-key-here";)
    const apiKey = window.OPENAI_API_KEY;

    // Send request to OpenAI's chat completions API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: "You are a creative chef assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048, // Increased to allow longer AI responses
      }),
    });

    const result = await response.json();

    // Get the AI's reply
    const aiReply =
      result.choices && result.choices[0] && result.choices[0].message.content
        ? result.choices[0].message.content
        : "Oops! Something went wrong while remixing your recipe. Please try again in a moment.";

    // Display the remixed recipe in the remix box
    remixOutput.textContent = aiReply;
    remixOutput.style.display = aiReply ? "block" : "none"; // Show if not empty
  } catch (error) {
    remixOutput.textContent =
      "Oops! Something went wrong while remixing your recipe. Please try again in a moment.";
    remixOutput.style.display = "block";
  }
}

// --- Event listeners ---
randomBtn.addEventListener("click", fetchAndDisplayRandomRecipe);
remixBtn.addEventListener("click", remixRecipeWithAI);

// When the page loads, show a random recipe right away and load saved recipes
window.addEventListener("load", function () {
  fetchAndDisplayRandomRecipe();
  renderSavedRecipesList();
  renderSavedRemixList();

  // Add Save Remix button to the remix container
  const remixContainer = document.querySelector(".remix-container");
  let saveRemixBtn = document.getElementById("save-remix-btn");
  if (remixContainer && !saveRemixBtn) {
    saveRemixBtn = document.createElement("button");
    saveRemixBtn.id = "save-remix-btn";
    saveRemixBtn.className = "save-inline-btn"; // Use same style as Save Recipe button
    saveRemixBtn.textContent = "Save Remix";
    saveRemixBtn.style.display = "none"; // Hide initially
    remixContainer.appendChild(saveRemixBtn);

    saveRemixBtn.addEventListener("click", function () {
      if (!currentRecipe || !currentRecipe.strMeal) return;
      const remixText = remixOutput.textContent;
      if (!remixText || remixText.trim() === "") return;
      let remixes = getSavedRemixes();
      // Only save if not already present
      if (!remixes.some((r) => r.name === currentRecipe.strMeal)) {
        remixes.push({ name: currentRecipe.strMeal, remix: remixText });
        setSavedRemixes(remixes);
        renderSavedRemixList();
      }
    });
  }

  // Show/hide Save Remix button based on remix-output content
  function updateSaveRemixBtnVisibility() {
    if (!saveRemixBtn) return;
    if (remixOutput.textContent && remixOutput.textContent.trim() !== "") {
      saveRemixBtn.style.display = "inline-block";
    } else {
      saveRemixBtn.style.display = "none";
    }
  }

  // Observe changes to remixOutput to toggle button visibility
  const remixObserver = new MutationObserver(updateSaveRemixBtnVisibility);
  remixObserver.observe(remixOutput, { childList: true, subtree: true, characterData: true });

  // Also update visibility on every remix
  updateSaveRemixBtnVisibility();
});
