extends Control

const UIFactory = preload("res://scripts/ui/ui_factory.gd")
const Palette = preload("res://scripts/ui/palette.gd")

func _ready() -> void:
	UIFactory.apply_theme(self)
	var bg = ColorRect.new()
	bg.color = Palette.BG
	UIFactory.fill(bg)
	add_child(bg)
	var root = UIFactory.screen_root("Result")
	add_child(root)
	var box = UIFactory.vbox(10)
	root.add_child(box)
	box.add_child(UIFactory.title("战斗结果"))
	var summary = UIFactory.vbox(6)
	summary.add_child(UIFactory.label("结果: %s" % RunState.outcome))
	summary.add_child(UIFactory.label("回合数: %s" % RunState.turn_count, true))
	summary.add_child(UIFactory.label("奖励: %s" % ", ".join(RunState.rewards), true))
	summary.add_child(UIFactory.label("损失: %s" % ", ".join(RunState.losses), true))
	box.add_child(UIFactory.panel(summary))
	var actions = UIFactory.hbox(8)
	actions.add_child(UIFactory.button("战利品", func() -> void: SceneRouter.go("loot")))
	actions.add_child(UIFactory.button("主菜单", func() -> void:
		RunState.clear()
		SceneRouter.go("main_menu")
	))
	box.add_child(actions)

