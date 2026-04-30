extends Control

const UIFactory = preload("res://scripts/ui/ui_factory.gd")
const Palette = preload("res://scripts/ui/palette.gd")

func _ready() -> void:
	UIFactory.apply_theme(self)
	var bg = ColorRect.new()
	bg.color = Palette.BG
	UIFactory.fill(bg)
	add_child(bg)
	var root = UIFactory.screen_root("Loot")
	add_child(root)
	var box = UIFactory.vbox(10)
	root.add_child(box)
	box.add_child(UIFactory.title("战利品"))
	var reward_box = UIFactory.vbox(6)
	var rewards: Array = RunState.rewards
	if rewards.is_empty():
		rewards = ["field-data", "rift-shard"]
	for reward in rewards:
		reward_box.add_child(UIFactory.label("获得: %s" % reward))
	box.add_child(UIFactory.panel(reward_box))
	box.add_child(UIFactory.button("继续", func() -> void: SceneRouter.go("result")))

