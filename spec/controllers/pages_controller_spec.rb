require 'rails_helper'

RSpec.describe PagesController, type: :feature do
  describe "GET #home" do
    it 'responds successfully with an HTTP 200 status code' do
      get :home
      expect(response).to be_success
      expect(response).to have_http_status(200)
    end

    it 'to have specific content "Herro World"' do
      visit root_path
      expect(page).to have_text("Herro World")
    end
  end
end
