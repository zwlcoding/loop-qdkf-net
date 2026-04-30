extends Control

const UIFactory = preload("res://scripts/ui/ui_factory.gd")
const Palette = preload("res://scripts/ui/palette.gd")

func _ready() -> void:
	UIFactory.apply_theme(self)
	var bg = ColorRect.new()
	bg.color = Palette.BG
	UIFactory.fill(bg)
	add_child(bg)
	var root = UIFactory.screen_root("RiftMap")
	add_child(root)
	var box = UIFactory.vbox(10)
	root.add_child(box)
	box.add_child(UIFactory.title("裂隙地图"))
	box.add_child(UIFactory.label("选择一条不稳定的路线。任务规则将揭示压力和撤离条件。", true))
	for mission in ContentRegistry.get_items("missions"):
		var panel_box = UIFactory.vbox(6)
		panel_box.add_child(UIFactory.label(mission.get("name", mission.get("id", "")), false, 18))
		panel_box.add_child(UIFactory.label(mission.get("summary", ""), true, 14))
		panel_box.add_child(UIFactory.button("出击", func() -> void:
			RunState.start_run(mission.get("id", ""), mission.get("map_id", ""))
			SceneRouter.go("battle")
		))
		box.add_child(UIFactory.panel(panel_box))
	var back_row = UIFactory.hbox(8)
	back_row.add_child(UIFactory.button("返回", func() -> void: SceneRouter.go("loadout")))
	box.add_child(back_row)

