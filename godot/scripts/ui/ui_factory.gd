extends RefCounted
class_name UIFactory

const Palette = preload("res://scripts/ui/palette.gd")

static func apply_theme(root: Control) -> void:
	var theme_resource = load("res://themes/prototype_theme.tres")
	if theme_resource:
		root.theme = theme_resource

static func fill(control: Control) -> void:
	control.set_anchors_preset(Control.PRESET_FULL_RECT)
	control.offset_left = 0
	control.offset_top = 0
	control.offset_right = 0
	control.offset_bottom = 0

static func screen_root(title: String = "") -> MarginContainer:
	var margin = MarginContainer.new()
	fill(margin)
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_top", 18)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 18)
	margin.name = "%sRoot" % title.replace(" ", "")
	return margin

static func vbox(separation: int = 10) -> VBoxContainer:
	var box = VBoxContainer.new()
	box.add_theme_constant_override("separation", separation)
	box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	box.size_flags_vertical = Control.SIZE_EXPAND_FILL
	return box

static func hbox(separation: int = 8) -> HBoxContainer:
	var box = HBoxContainer.new()
	box.add_theme_constant_override("separation", separation)
	box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return box

static func title(text: String) -> Label:
	var label = Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 30)
	label.add_theme_color_override("font_color", Palette.TEXT)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return label

static func label(text: String, muted: bool = false, size: int = 15) -> Label:
	var label = Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", Palette.MUTED if muted else Palette.TEXT)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return label

static func button(text: String, callback: Callable) -> Button:
	var button = Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(48, 48)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if callback.is_valid():
		button.pressed.connect(callback)
	return button

static func panel(child: Control = null) -> PanelContainer:
	var panel = PanelContainer.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var style = StyleBoxFlat.new()
	style.bg_color = Palette.PANEL
	style.border_color = Color("#2c3854")
	style.border_width_left = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_bottom = 1
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_left = 12
	style.content_margin_top = 10
	style.content_margin_right = 12
	style.content_margin_bottom = 10
	panel.add_theme_stylebox_override("panel", style)
	if child:
		panel.add_child(child)
	return panel

static func chip(text: String, color: Color) -> Label:
	var label = Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.custom_minimum_size = Vector2(64, 28)
	label.add_theme_font_size_override("font_size", 13)
	label.add_theme_color_override("font_color", Palette.BG)
	var style = StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	style.content_margin_left = 8
	style.content_margin_right = 8
	label.add_theme_stylebox_override("normal", style)
	return label

