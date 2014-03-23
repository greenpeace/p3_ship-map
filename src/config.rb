# Require any additional compass plugins here.
require "compass"

# Set this to the root of your project when deployed:
http_path = "/"
css_dir = "css"
sass_dir = "scss"
images_dir = "img"
javascripts_dir = "js"
sass_options = {:cache_location => "#{Compass.configuration.project_path}\tmp\sass-cache"} 

# You can select your preferred output style here (can be overridden via the command line):
# output_style = :expanded or :nested or :compact or :compressed
output_style = :compact
# To enable relative paths to assets via compass helper functions. Uncomment:
relative_assets = true
# To disable debugging comments that display the original location of your selectors. Uncomment:
line_comments = true

# Have Growl? http://growl.info
# 1. run `gem install compass-growl`
# 2. uncomment the following:
# require "compass-growl"
