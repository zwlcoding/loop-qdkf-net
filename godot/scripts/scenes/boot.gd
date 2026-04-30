extends Control

const UIFactory = preload("res://scripts/ui/ui_factory.gd")
const Palette = preload("res://scripts/ui/palette.gd")

func _ready() -> void:
	UIFactory.apply_theme(self)
	var background = ColorRect.new()
	background.color = Palette.BG
	UIFactory.fill(background)
	add_child(background)
	var root = UIFactory.screen_root("Boot")
	add_child(root)
	var box = UIFactory.vbox(12)
	root.add_child(box)
	box.add_child(UIFactory.title("Loop Rift"))
	var status = UIFactory.label("正在加载Godot原型内容...", true)
	box.add_child(status)
	var ok = ContentRegistry.load_all()
	if ok:
		GameState.ensure_squad()
		AudioSettings.play_music("menu")
		await get_tree().create_timer(0.15).timeout
		SceneRouter.go("main_menu")
	else:
		status.text = "内容校验失败:\n%s" % "\n".join(ContentRegistry.validation_errors)

