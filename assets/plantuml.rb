require "plantuml_builder"

assets_path = File.expand_path("..", __FILE__)
uml_texts_path = "#{assets_path}/uml_texts"
uml_images_path = "#{assets_path}/uml_images"

Dir.foreach(uml_texts_path) do |file_name|
  next if file_name == '.' || file_name == '..'
  file_content = File.read "#{uml_texts_path}/#{file_name}"
  base_name = File.basename file_name, '.txt'
  output = PlantumlBuilder::Formats::PNG.new(file_content).load
  File.open("#{uml_images_path}/#{base_name}.png", 'w') do |f|
    f.write(output)
  end
end
