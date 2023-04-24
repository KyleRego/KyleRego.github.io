---
layout: post
title: "Health notes"
categories: miscellaneous
permalink: /health
emoji: 🫠
mathjax: true
small_title: true
---

- [Complete protein](https://en.wikipedia.org/wiki/Complete_protein)
- [Empty calories](https://en.wikipedia.org/wiki/Empty_calories)
- [Illnesses caused by underconsumption and overconsumption](https://en.wikipedia.org/wiki/Human_nutrition#Illnesses_caused_by_underconsumption_and_overconsumption)
- [Protein leverage hypothesis](https://en.wikipedia.org/wiki/Protein_leverage_hypothesis)

<input type="text" id="calculator-input"><label for="calculator-input"> grams</label>
<br>
<div id="calculator-output"></div>
<script>
  function calculatorOutputTextContent(grams) {
    const numGrams = Number(grams)
    if (isNaN(numGrams)) {
      return "Input must be a number";
    } else {
      const foodNutritionData = {
        // "Food": [calories per serving, grams per serving, grams protein per serving]
        "Chicken breast": [285, 172, 53],
        "Chicken thighs with skin": [240, 135, 32],
        "Chicken thighs without skin": [210, 115, 29],
        "Chicken tenderloins": [75, 45, 14],
        "Peanut butter": [180, 32, 8]
      };
      let result = ``;
      Object.keys(foodNutritionData).forEach(function(food) {
        const data = foodNutritionData[food];
        const caloriesPerServing = data[0]
        const gramsPerServing = data[1]
        const gramsProteinPerServing = data[2]
        const servings = numGrams / gramsPerServing;
        const calories = (servings * caloriesPerServing).toFixed(1);
        const protein = (servings * gramsProteinPerServing).toFixed(1);
        result += `${food} - ${calories} calories, ${protein} grams protein<br>`;
      });
      return result;
    }
  };
  const calculatorInput = document.querySelector("#calculator-input");
  const calculatorOutput = document.querySelector("#calculator-output");
  calculatorInput.addEventListener("input", function() {
    calculatorOutput.innerHTML = calculatorOutputTextContent(calculatorInput.value);
  });
</script>

# Human nutrition

- **Water**
- **Oxygen**
- Proteins
  - **Essential amino acids**
  - Non-essential amino acids
- Fats/lipids
  - Unsaturated fats
    - Monounsaturated fats
    - Polyunsaturated fats
      - Omega-3 fatty acids
        - **$$ \alpha $$-Linolenic acid**
      - Omega-6 fatty acids
        - **Linoleic acid**
    - <span style="font-weight: bold; color: red;">Trans fats</span>
  - Saturated fats
  - Cholesterol
- Carbohydrates
- Fiber
- **Vitamins**
- **Minerals**
- **Choline**

# Essential nutrients

- Essential amino acids - chicken (S), milk (S), eggs (A), sardines (A)
- Essential fatty acids
  - $$ \alpha $$-Linolenic acid - ground flaxseed (S)
- Vitamins
  - Fat-soluble
    - Vitamin A - CTRL (S), milk (A)
    - Vitamin D - CTRL (S), sardines (A), milk (A)
    - Vitamin E - CTRL (S), peanut butter (A)
    - Vitamin K - broccoli (A), chicken (B)
  - Water-soluble
    - B vitamins
      - Vitamin B1 (Thiamin) - CTRL (S), peanut butter (C)
      - Vitamin B2 (Riboflavin) - CTRL (S), milk (A), sardines (B), peanut butter (C)
      - Vitamin B3 (Niacin) - CTRL (S), peanut butter (S), sardines (A)
      - Vitamin B5 (Pantothenic acid) - CTRL (S), peanut butter (C)
      - Vitamin B6 (Pyridoxine) - CTRL (S), bananas (B), potatoes (B), peanut butter (C), whole wheat bread (C)
      - Vitamin B7 (Biotin) - CTRL (S)
      - Vitamin B9 (Folate) - CTRL (S), peanut butter (C)
      - Vitamin B12 (Cobalamin) - sardines (S), CTRL (S), milk (S)
    - Vitamin C - potatoes (S), CTRL (A), bananas (B)
- Minerals
  - Macrominerals
    - Calcium - milk (S), sardines (A), whole wheat bread (C)
    - Potassium - potatoes (C), bananas (C), milk (C)
    - Phosphorus - sardines (S), milk (B), peanut butter (C)
    - Magnesium - peanut butter (B), whole wheat bread (B), milk (C)
  - Trace elements
    - Copper - CTRL (S), peanut butter (C)
    - Chromium - CTRL (S)
    - Manganese - CTRL (S), bananas (B)
    - Molybdenum - CTRL (S)
    - Selenium - sardines (S), CTRL (S), milk (A)
    - Zinc - CTRL (S), milk (C), peanut butter (C)
    - Iron - sardines (B), peanut butter (C)
    - Copper - potatoes
    - Iodine

Other essential nutrients: water, oxygen, sodium (salt), chlorine (also salt), cobalt (in vitamin B12), linoleic acid (in chicken).

# Foods

## Chicken

| Serving                                   | grams | Calories | Protein (g) |
| 1 thigh with skin, cooked, edible portion | 135   | 240      | 32          |
| 1 thigh without skin, cooked              | 115   | 210      | 29          |
| 1 tenderloin, cooked                      | 45    | 75       | 14          |
| 1 breast, cooked                          | 172   | 285      | 53          |

## Bananas and potatoes

| Serving    | 100 g bananas   | 100 g potatoes |
| Calories   | 90       | 80     |
| Vitamin B6 | 20% DV   | 15% DV |
| Vitamin C  | 14% DV   | 32% DV |
| Manganese  | 13%      |
| Potassium  | 10% DV   | 12% DV |

## Sardines

| Serving     | 100 g   |
| Calories    | 185     |
| Protein     | 21 g    |
| Vitamin B12 | 375% DV |
| Selenium    | 58% DV  |
| Phosphorus  | 52% DV  |
| Vitamin D   | 32% DV  |
| Vitamin B3  | 28% DV  |
| <span style="color: red;">Sodium</span>      | 28% DV  |
| Calcium     | 24% DV  |
| Vitamin B2  | 19% DV  |
| Iron        | 18% DV  |
| Choline     | 16% DV  |
| Vitamin B5  | 15% DV  |
| Zinc        | 15% DV  |
| Copper      | 14% DV  |
| Magnesium   | 10% DV  |

## Peanut Butter

| Serving    | 100 g  | 2 tbsp (32 g) |
| Calories   | 600    | 180           |
| Protein    | 22 g   | 8 g           |
| Vitamin B3 | 89% DV |
| Vitamin E  | 61% DV |
| Magnesium  | 48% DV |
| Phosphorus | 48% DV |
| Vitamin B6 | 34% DV |
| <span style="color: red;">Sodium</span>     | 29% DV |
| Zinc       | 27% DV |
| Vitamin B5 | 22% DV |
| Vitamin B9 | 22% DV |
| Copper     | 21% DV |
| Iron       | 13% DV |
| Vitamin B2 | 16% DV |
| Vitamin B1 | 12% DV |
| Potassium  | 12% DV |

## Whole Wheat Bread

| Serving    | 100 g  |
| Calories   | 250    |
| Protein    | 13 g   |
| Magnesium  | 20% DV |
| Calcium    | 10% DV |
| Vitamin B6 | 10% DV |

## Milk

| Serving | 1 cup (240 mL) fat free Fairlife |
| Calories    | 80     | 
| Protein     | 13 g   |
| Vitamin B12 | 45% DV |
| Calcium     | 30% DV |
| Vitamin D   | 25% DV |
| Vitamin B2  | 20% DV |
| Selenium    | 20% DV |
| Phosphorus  | 20% DV |
| Vitamin A   | 15% DV |
| Zinc        | 15% DV |
| Potassium   | 8% DV  |
| Magnesium   | 6% DV  |
