extends Control

const UIFactory = preload("res://scripts/ui/ui_factory.gd")
const Palette = preload("res://scripts/ui/palette.gd")

func _ready() -> void:
	UIFactory.apply_theme(self)
	var bg = ColorRect.new()
	bg.color = Palette.BG
	UIFactory.fill(bg)
	add_child(bg)
	var root = UIFactory.screen_root("MainMenu")
	add_child(root)
	var box = UIFactory.vbox(14)
	root.add_child(box)
	box.add_child(UIFactory.title("Loop Rift"))
	box.add_child(UIFactory.label("移动端小队战术原型，使用Godot 4.6重建。", true, 16))
	box.add_spacer(false)
	var actions = UIFactory.vbox(10)
	box.add_child(UIFactory.panel(actions))
	actions.add_child(UIFactory.button("开始本地作战", func() -> void:
		AudioSettings.play_ui_click()
		GameState.ensure_squad()
		SceneRouter.go("loadout")
	))
	actions.add_child(UIFactory.button("快速战斗测试", func() -> void:
		AudioSettings.play_ui_click()
		GameState.ensure_squad()
		var mission_id = ContentRegistry.first_id("missions")
		var mission = ContentRegistry.by_id("missions", mission_id)
		RunState.start_run(mission_id, mission.get("map_id", "ridge_gate"))
		SceneRouter.go("battle")
	))
	actions.add_child(UIFactory.button("校验内容", func() -> void:
		AudioSettings.play_ui_click()
		ContentRegistry.validate()
		_show_validation(box)
	))
	box.add_spacer(false)
	box.add_child(UIFactory.label("当前小队: %s" % ", ".join(GameState.selected_squad), true, 14))

func _show_validation(box: VBoxContainer) -> void:
	var result = "内容校验通过"
	if not ContentRegistry.validation_errors.is_empty():
		result = "\n".join(ContentRegistry.validation_errors)
	box.add_child(UIFactory.panel(UIFactory.label(result, ContentRegistry.validation_errors.is_empty())))

