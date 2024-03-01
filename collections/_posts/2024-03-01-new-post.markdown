---
layout: post
title: "One way to add and remove form fields on the fly in Rails"
date: 2024-03-01 10:15:00 -0500
categories: blogging
permalink: /one-way-to-add-and-remove-form-fields-on-the-fly-in-rails
emoji: 🤔
mathjax: false
---

Rails provides some help for [building a complex HTML form that can edit multiple objects/database records at the same time](https://guides.rubyonrails.org/form_helpers.html#building-complex-forms). However, it is not everything needed for a form that allows adding and removing fields "on the fly" which is noted in the guide:

> Rather than rendering multiple sets of fields ahead of time you may wish to add them only when a user clicks on an "Add new address" button. Rails does not provide any built-in support for this. When generating new sets of fields you must ensure the key of the associated array is unique - the current JavaScript date (milliseconds since the epoch) is a common choice.

I did this today and wanted to note the approach, which is far from perfect but good enough for the little Rails app I was working on. The app has a model `Recipe` with many dependent `Step` records. I just wanted my recipe form to allow adding and removing recipe steps one at a time. I had to consider that steps of a recipe have an order to them too.

To illustrate what I mean, this is what the form first looks like when creating a new recipe (it is not completely polished yet):

![A picture of an HTML form for creating a recipe](assets/fields-on-the-fly-in-rails/image1.png)

Clicking the "New step" adds fields to the form:

![The form but now with more fields for editing a recipe step after New step was clicked](assets/fields-on-the-fly-in-rails/image2.png)

And clicking "New step" again does the same, but removes the button to remove a step except for the last step:

![The form but now with 2 steps that can be edited for the recipe after New step was clicked a second time](assets/fields-on-the-fly-in-rails/image3.png)

Clicking the remove step button (the garbage can) removes the last step and makes the remove button appear on the step which becomes the last step next.

From a user perspective, the form works exactly the same for editing a recipe:

![The form being used to edit a recipe](assets/fields-on-the-fly-in-rails/image4.png)

The `recipes#create` action that handles the POST creating a new recipe with the dependent steps is this:

{% highlight ruby %}
def create
  @recipe = Recipe.new(recipe_params)

  if @recipe.save
    redirect_to recipe_url(@recipe), notice: "Recipe was successfully created."
  else
    render :new, status: :unprocessable_entity
  end
end
{% endhighlight %}

The action is very simple and only works because the model is configured with `accepts_nested_attributes_for`:

{% highlight ruby %}
class Recipe < ApplicationRecord
  has_and_belongs_to_many :ingredients
  has_many :steps, inverse_of: :recipe, dependent: :destroy
  accepts_nested_attributes_for :steps
end
{% endhighlight %}

The controller also needs to allow the nested params:

{% highlight ruby %}
  private
    ...

    def recipe_params
      params.require(:recipe).permit(:name, :steps, :description, steps_attributes: [:step, :notes, :number])
    end
{% endhighlight %}

I wrote one request spec for the action that also could be useful for seeing the structure of the params that is expected for this to work:

{% highlight ruby %}
RSpec.describe RecipesController, "#create" do
  subject(:post_create_recipe) do
    post recipes_path, params:
  end

  let(:params) do
    {
      recipe: {
        name:,
        description:,
        steps_attributes:
      }
    }
  end

  let(:name) { "Some recipe name" }
  let(:description) { "Some recipe description" }
  let(:steps_attributes) do
    { 0 => {
        step: "boil 6 cups of water in a medium pan",
        notes: "some notes",
        number: 0
      }
    }
  end

  it "creates a recipe with a step for valid data and redirects" do
    expect { post_create_recipe }.to change(Recipe, :count).by(1).and change(Step, :count).by(1)
    expect(response).to have_http_status(:found)
  end
end
{% endhighlight %}

The controller action and this spec were set up before working out how to add and remove fields on the fly in the form itself. At that point, I was seeing how far I could get with the `fields_for` form helper that creates the form elements for dependent objects that submit the params with the structure expected by Rails. But it doesn't work when the number of form elements is not fixed. 

My approach was a combination of Turbo frames and some Stimulus controllers. Adding a new step makes a Turbo frame request:

{% highlight ruby %}{% raw %}
<%= turbo_frame_tag("new_step") do %>
  <%= link_to "New step", new_step_path %>
<% end %>
{% endraw %}{% endhighlight %}

I chose to use the normal `steps#new` action for this which renders this:

{% highlight ruby %}{% raw %}
<%= turbo_frame_tag("new_step") do %>
  <li data-controller="new-step-form" class="step-list-item">
    <div class="flex">
      <div class="flex-grow-1 mr-1">
        <label data-new-step-form-target="stepLabel"></label>
        <textarea rows="1" data-new-step-form-target="stepTextarea"></textarea>
      </div>

      <div class="flex-grow-1">
        <label data-new-step-form-target="notesLabel">Notes:</label>
        <textarea rows="1" data-new-step-form-target="notesTextarea"></textarea>
      </div>

      <div class="flex flex-col justify-around">
        <button
            type="button"
            title="Remove step"
            class="remove-step-button mt-4"
            data-action="click->new-step-form#removeStep">
          <%= render partial: "layouts/heroicons/trash", locals: { css_class: "w-6 h-6" } %>
        </button>
      </div>

      <input data-new-step-form-target="numberInput" autocomplete="off" type="hidden"/>
    </div>
  </li>

  <li>
    <%= turbo_frame_tag("new_step") do %>
      <%= link_to "New step", new_step_path %>
    <% end %>
  </li>
<% end %>
{% endraw%}{% endhighlight %}

At the end is where the "New step" link is added in after the new form elements, which will make a Turbo frame request to the same endpoint. The `data-controller="new-step-form"` attaches a controller to that list item element that contains the form elements. Stimulus monitors the DOM for `data-controller` elements so inserting this HTML from a turbo frame is not a problem. In this case Stimulus will look for a matching controller in the file `new_step_form_controller.js`. The `data-action="click->new-step-form#removeStep"` on the `<button>` specifies that clicking that button will invoke the `removeStep()` action of that controller. The controller will be able to target elements that have the attributes like `data-new-step-form-target="numberInput"`. The controller sets up the attributes on those form element targets dynamically by interrogating how many step form elements are already on the page (To me this seems necessary to do. The attribute values need that information about their order, and it can't be tracked on the server without also saving/deleting steps in the database when adding/removing form elements on the page. But that introduces its own complexity and does not fit the design of the controller action and model with `accepts_nested_attributes_for`):

{% highlight javascript %}
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "stepLabel", "stepTextarea", "notesLabel", "notesTextarea", "numberInput" ];

  connect() {
    let thisStepsNumber = -1 + document.querySelectorAll(".step-list-item").length;

    this.stepLabelTarget.setAttribute("for", `recipe_steps_attributes_${thisStepsNumber}_step`);
    this.stepLabelTarget.textContent = `Step ${thisStepsNumber}:`;

    this.stepTextareaTarget.setAttribute("name", `recipe[steps_attributes][${thisStepsNumber}][step]`);
    this.stepTextareaTarget.setAttribute("id", `recipe_steps_attributes_${thisStepsNumber}_step`);
  
    this.notesLabelTarget.setAttribute("for", `recipe_steps_attributes_${thisStepsNumber}_notes`);

    this.notesTextareaTarget.setAttribute("name", `recipe[steps_attributes][${thisStepsNumber}][notes]`);
    this.notesTextareaTarget.setAttribute("id", `recipe_steps_attributes_${thisStepsNumber}_notes`);

    this.numberInputTarget.setAttribute("value", thisStepsNumber);
    this.numberInputTarget.setAttribute("name", `recipe[steps_attributes][${thisStepsNumber}][number]`);
    this.numberInputTarget.setAttribute("id", `recipe_steps_attributes_${thisStepsNumber}_number`);

    this.showOnlyLastRemoveStepButton();
  }

  removeStep() {
    this.element.remove();
    this.showOnlyLastRemoveStepButton();
  }

  showOnlyLastRemoveStepButton() {
    let btns = document.querySelectorAll(".remove-step-button")
    let btnsCount = btns.length;
    btns.forEach((btn, i) => {
      if (i !== btnsCount - 1) {
        btn.classList.add("display-none");
      } else {
        btn.classList.remove("display-none");
      }
    });
  }
}

{% endhighlight %}

The `connect()` lifecycle method executes when the controller connects to the DOM. The values of the attributes are set there so that the HTML is the same as what would be created by `fields_for`. The `removeStep()` action simply removes the element that the controller is attached to with `this.element.remove()` and then calls the method that ensures the form is left with only the last step having a button to remove it.

Going back to the `_form.html.erb`, before the `new_step` turbo frame element, this is how the step form elements are created for steps that are already persisted in the database when editing an existing recipe:

{% highlight ruby %}
<% num_steps = @recipe.steps.count %>
<% @recipe.steps.order(:number).each_with_index do |step, ctr| %>
  <li data-controller="edit-step-form" class="step-list-item">
    <div class="flex">
      <div class="flex-grow-1 mr-1">
        <label for="recipe_steps_attributes_<%= ctr %>_step"
            >Step <%= ctr %>:</label>
        <textarea rows="1" name="recipe[steps_attributes][<%= ctr %>][step]"
                          id="recipe_steps_attributes_<%= ctr %>_step"
            ><%= step.step %></textarea>
      </div>  

      <div class="flex-grow-1">
        <label for="recipe_steps_attributes_<%= ctr %>_notes"
            >Notes:</label>
        <textarea
              rows="1"
              name="recipe[steps_attributes][<%= ctr %>][notes]"
              id="recipe_steps_attributes_<%= ctr %>_notes"
          ><%= step.notes %></textarea>
      </div>

      <div class="flex flex-col justify-around">
        <button
            type="button"
            title="Remove step"
            class="remove-step-button mt-4 <%= (ctr + 1) == num_steps ? '' : 'display-none' %>"
            data-action="click->edit-step-form#removeStep">
          <%= render partial: "layouts/heroicons/trash", locals: { css_class: "w-6 h-6" } %>
        </button>
      </div>

      <input
          autocomplete="off"
          type="hidden" value="<%= ctr %>"
          name="recipe[steps_attributes][<%= ctr %>][number]"
          id="recipe_steps_attributes_<%= ctr %>_number" />
    </div>
  </li>
<% end %>
{% endhighlight %}

It just iterates through the steps and creates the form elements for them in a different way, that is also pretty crude. A different Stimulus controller is used (`data-controller="edit-step-form"`) and honestly it is just the first Stimulus controller but without the `connect()` method implemented. Removing the code duplication there is an obvious way the implementation could be improved and I'll refactor that. That duplication is obvious anyway, more concerning is information about the structure of the HTML steps form elements is not contained to a single place. It's in `recipes/_form.html.erb` for creating the form elements for steps in the database. For new steps, that information is in both the `steps/new.html.erb` turbo frame and the Stimulus controller that sets the attributes on the form elements. Rearranging things to get that information more encapsulated would be good too.

The final thing to note is `recipes#update`:

{% highlight ruby %}
def update
  @recipe.steps.each(&:destroy!)
  @recipe.update!(recipe_params)
  redirect_to recipe_url(@recipe), notice: "Recipe was successfully updated."

  rescue

  render :edit, status: :unprocessable_entity
end
{% endhighlight %}

This could be improved too, at the very least with a transaction but it's good enough.

# Summary

This is just one way to do this. The implementation is crude in a few places with some clear potential for refactoring but it's good enough for now to note the general idea while it's in my head. New form elements are added with a turbo frame that connects to a Stimulus controller that interrogates the DOM to set the correct attributes on those form elements, since those are dependent on how many form elements there are already, which the server doesn't know. Form elements for steps that have already been saved to the database are rendered in the template normally. Regardless of whether the form elements are rendered as part of a new step turbo frame or the initial form of the edit page, they are created just as they would be by `fields_for` so that the controller actions can take advantage of `accepts_nested_attributes_for`.