Rails.application.routes.draw do
  devise_for :members
  root to: "pages#home"
end
