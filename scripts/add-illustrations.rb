#!/usr/bin/env ruby
# Adds 11 imageset folders to the Xcode project's main group and
# registers them as PBXFileReference + PBXBuildFile (Resources).
require 'xcodeproj'

PROJECT_PATH = 'ios/HealthLens.xcodeproj'
ASSETS_DIR   = 'ios/HealthLens/Images.xcassets'

imagesets = %w[
  empty_plate
  empty_history
  ai_scanning
  grade_a_plus
  water_tracking
  goal_hypertension
  goal_diabetes
  goal_gut_health
  goal_weight
  splash_logo
  app_icon_grade
]

project = Xcodeproj::Project.open(PROJECT_PATH)
target  = project.targets.find { |t| t.name == 'HealthLens' }
abort 'HealthLens target not found' unless target

# Locate Images.xcassets PBXFileReference
images_xcassets_ref = nil
project.main_group.recursive_children.each do |child|
  next unless child.is_a?(Xcodeproj::Project::Object::PBXFileReference)
  if child.path == 'Images.xcassets' || child.real_path.to_s.end_with?('Images.xcassets')
    images_xcassets_ref = child
    break
  end
end
abort "Images.xcassets not found in project" unless images_xcassets_ref

# Find the parent group of Images.xcassets (typically "HealthLens" group)
parent_group = images_xcassets_ref.parent
abort 'Cannot find parent group' unless parent_group

# Locate the Resources build phase
resources_phase = target.resources_build_phase

added = []
already = []

imagesets.each do |name|
  imageset_dir = "#{ASSETS_DIR}/#{name}.imageset"
  next unless File.directory?(imageset_dir)

  # Skip if already a child of the same parent group
  existing = parent_group.files.find do |f|
    (f.path == "#{name}.imageset") ||
      (f.path&.end_with?("#{name}.imageset") && f.last_known_file_type == 'folder.assetcatalog')
  end
  if existing
    already << name
    next
  end

  # Add the .imageset folder to the SAME parent group as Images.xcassets
  # (This is how legacy xcassets-with-imagesets work in non-synchronized mode)
  rel_path = "Images.xcassets/#{name}.imageset"
  file_ref = parent_group.new_reference(rel_path)
  file_ref.last_known_file_type = 'folder.assetcatalog'
  # Add to Resources build phase
  resources_phase.add_file_reference(file_ref)
  added << name
end

project.save

puts "✅ Added #{added.length} imagesets to project:"
added.each { |n| puts "   - #{n}" }
unless already.empty?
  puts "ℹ️  Already present: #{already.join(', ')}"
end
