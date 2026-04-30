extends Control

const UIFactory = preload("res://scripts/ui/ui_factory.gd")
const Palette = preload("res://scripts/ui/palette.gd")

var selected: Array = []
var unit_list: VBoxContainer

func _ready() -> void:
	UIFactory.apply_theme(self)
	selected = GameState.selected_squad.duplicate()
	_build()

func _build() -> void:
	var bg = ColorRect.new()
	bg.color = Palette.BG
	UIFactory.fill(bg)
	add_child(bg)
	var root = UIFactory.screen_root("Loadout")
	add_child(root)
	var box = UIFactory.vbox(10)
	root.add_child(box)
	box.add_child(UIFactory.title("小队配置"))
	box.add_child(UIFactory.label("为本次本地作战选择三个机甲。", true))
	var scroll = ScrollContainer.new()
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.custom_minimum_size = Vector2(0, 300)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	unit_list = UIFactory.vbox(8)
	unit_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(unit_list)
	box.add_child(UIFactory.panel(scroll))
	_render_units()
	var action_row = UIFactory.hbox(8)
	box.add_child(action_row)
	action_row.add_child(UIFactory.button("返回", func() -> void: SceneRouter.go("main_menu")))
	action_row.add_child(UIFactory.button("准备就绪", func() -> void:
		GameState.set_selected_squad(selected)
		SceneRouter.go("rift_map")
	))

func _render_units() -> void:
	for child in unit_list.get_children():
		child.queue_free()
	for chassis in ContentRegistry.get_items("chassis"):
		var id: String = chassis.get("id", "")
		var row = UIFactory.hbox(8)
		var is_selected = selected.has(id)
		var chip = UIFactory.chip("已选" if is_selected else "未选", Palette.GREEN if is_selected else Palette.MUTED)
		chip.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		row.add_child(chip)
		var stat_label = UIFactory.label("%s  生命%s  移动%s 跳跃%s" % [chassis.get("name", id), chassis.get("hp", 0), chassis.get("move", 0), chassis.get("jump", 0)])
		stat_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(stat_label)
		var btn = Button.new()
		btn.text = "切换"
		btn.custom_minimum_size = Vector2(60, 40)
		btn.size_flags_horizontal = Control.SIZE_SHRINK_END
		btn.pressed.connect(_on_toggle_pressed.bind(id))
		row.add_child(btn)
		unit_list.add_child(row)

func _on_toggle_pressed(id: String) -> void:
	_toggle(id)

func _toggle(id: String) -> void:
	if selected.has(id):
		selected.erase(id)
		if selected.is_empty():
			for chassis in ContentRegistry.get_items("chassis"):
				var cid: String = chassis.get("id", "")
				if cid != id:
					selected.append(cid)
					break
	elif selected.size() < 3:
		selected.append(id)
	else:
		selected[0] = id
	_render_units()

