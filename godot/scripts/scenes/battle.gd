extends Control

const UIFactory = preload("res://scripts/ui/ui_factory.gd")
const Palette = preload("res://scripts/ui/palette.gd")
const BattleBoardScript = preload("res://scripts/scenes/battle_board.gd")
const BattleControllerScript = preload("res://scripts/battle/battle_controller.gd")

var controller = BattleControllerScript.new()
var board
var status_label: Label
var module_label: Label
var module_row: HBoxContainer
var facing_row: HBoxContainer
var log_label: Label
var diagnostics_label: Label
var diagnostics_panel: Control
var debug_visible = false
var mode = "move"

func _ready() -> void:
	UIFactory.apply_theme(self)
	if ContentRegistry.data.is_empty():
		ContentRegistry.load_all()
	GameState.ensure_squad()
	if RunState.current_mission_id.is_empty():
		var mission_id = ContentRegistry.first_id("missions")
		var mission = ContentRegistry.by_id("missions", mission_id)
		RunState.start_run(mission_id, mission.get("map_id", ""))
	_build_layout()
	controller.finished.connect(_on_finished)
	controller.changed.connect(_refresh_hud)
	controller.setup_from_run()
	_refresh_hud()

func _build_layout() -> void:
	var bg = ColorRect.new()
	bg.color = Palette.BG
	UIFactory.fill(bg)
	add_child(bg)
	var root = UIFactory.screen_root("战斗")
	add_child(root)
	var box = UIFactory.vbox(6)
	root.add_child(box)
	status_label = UIFactory.label("", false, 12)
	status_label.custom_minimum_size = Vector2(0, 54)
	status_label.clip_text = true
	status_label.max_lines_visible = 2
	status_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	box.add_child(UIFactory.panel(status_label))
	board = BattleBoardScript.new()
	board.custom_minimum_size = Vector2(320, 0)
	board.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	board.size_flags_vertical = Control.SIZE_EXPAND_FILL
	board.bind(controller)
	board.tile_pressed.connect(_on_tile_pressed)
	box.add_child(board)
	var command_panel = UIFactory.panel()
	box.add_child(command_panel)
	var command_box = UIFactory.vbox(6)
	command_panel.add_child(command_box)
	module_label = UIFactory.label("", false, 12)
	module_label.custom_minimum_size = Vector2(0, 76)
	module_label.clip_text = true
	module_label.max_lines_visible = 4
	command_box.add_child(module_label)
	module_row = UIFactory.hbox(5)
	module_row.custom_minimum_size = Vector2(0, 34)
	command_box.add_child(module_row)
	var action_row = UIFactory.hbox(5)
	command_box.add_child(action_row)
	action_row.add_child(_command_button("移动", func() -> void: _set_mode("move")))
	action_row.add_child(_command_button("攻击", func() -> void: _set_mode("attack")))
	action_row.add_child(_command_button("技能", func() -> void: _set_mode("skill")))
	action_row.add_child(_command_button("道具", func() -> void: _set_mode("tool")))
	action_row.add_child(_command_button("连携", func() -> void: _set_mode("combo")))
	var action_row_2 = UIFactory.hbox(5)
	command_box.add_child(action_row_2)
	action_row_2.add_child(_command_button("交互", func() -> void: controller.interact_active()))
	action_row_2.add_child(_command_button("取消", func() -> void: _set_mode("move")))
	action_row_2.add_child(_command_button("待机", func() -> void: controller.end_turn()))
	action_row_2.add_child(_command_button("调试", func() -> void: _toggle_debug()))
	facing_row = UIFactory.hbox(5)
	command_box.add_child(facing_row)
	log_label = Label.new()
	diagnostics_label = UIFactory.label("", true, 11)
	diagnostics_panel = UIFactory.panel(diagnostics_label)
	diagnostics_panel.visible = debug_visible
	box.add_child(diagnostics_panel)

func _command_button(text: String, callback: Callable) -> Button:
	var button = UIFactory.button(text, callback)
	button.custom_minimum_size = Vector2(48, 38)
	button.add_theme_font_size_override("font_size", 13)
	return button

func _set_mode(next_mode: String) -> void:
	mode = next_mode
	board.mode = mode
	controller.set_mode(mode)
	AudioSettings.play_ui_click()
	_refresh_hud()

func _select_module(module_id: String) -> void:
	if controller.set_selected_module(module_id):
		AudioSettings.play_ui_click()
	_refresh_hud()

func _on_tile_pressed(tile: Vector2i) -> void:
	var active = controller.active_unit()
	if active == null or active.team != "player":
		return
	if controller.awaiting_facing:
		return
	var did_act = false
	match mode:
		"move":
			did_act = controller.try_move_active(tile).get("ok", false)
		"attack":
			did_act = controller.try_action_active_at("attack", tile).get("ok", false)
		"skill":
			did_act = controller.try_action_active_at("skill", tile).get("ok", false)
		"tool":
			did_act = controller.try_action_active_at("tool", tile).get("ok", false)
		"combo":
			did_act = controller.try_action_active_at("combo", tile).get("ok", false)
	if did_act and ["attack", "skill", "combo"].has(mode):
		controller.end_turn()
	_refresh_hud()

func _refresh_hud() -> void:
	mode = controller.current_mode
	var active = controller.active_unit()
	var active_text = "无"
	if active:
		active_text = "%s HP%s/%s CT%s M%s A%s T%s" % [
			active.display_name(),
			active.hp,
			active.max_hp,
			active.readiness,
			"可" if active.can_move() else "否",
			"可" if active.can_act() else "否",
			"可" if active.can_use_tool() else "否"
		]
	var move_count = controller.movement_preview_for_active().size()
	var target_count = controller.target_preview_for_active(mode).size()
	var range_count = controller.action_range_positions_for_active(mode).size()
	var module_summary = controller.selected_module_summary(mode)
	var role_summary = controller.active_role_summary()
	status_label.text = "回合%s %s | %s | 移%s 射%s 目标%s | 连携%s\n%s" % [
		controller.turn_count,
		active_text,
		"目标%s 撤离%s 压力%s" % [
			"完成" if controller.mission_state.get("objective_complete", false) else "未",
			"开" if controller.mission_state.get("extraction_unlocked", false) else "锁",
			controller.mission_state.get("pressure_stage", 0)
		],
		move_count,
		range_count,
		target_count,
		controller.combo_resource,
		_event_banner_text(controller.recent_battle_event(), role_summary)
	]
	if module_label:
		module_label.text = _module_summary_text(module_summary, controller.selected_action_forecast(mode), role_summary)
	_refresh_module_controls()
	_refresh_facing_controls()
	log_label.text = "\n".join(controller.log_entries)
	if diagnostics_label:
		diagnostics_label.text = _build_diagnostics_text()
	if board:
		board.mode = mode
		board._on_controller_changed()
		board.queue_redraw()

func _refresh_module_controls() -> void:
	if module_row == null:
		return
	for child in module_row.get_children():
		module_row.remove_child(child)
		child.queue_free()
	var modules = controller.available_modules_for_mode(mode, controller.active_unit())
	if modules.is_empty():
		var placeholder = Label.new()
		placeholder.text = "当前模式无需选择模块"
		placeholder.add_theme_font_size_override("font_size", 12)
		placeholder.add_theme_color_override("font_color", Palette.MUTED)
		placeholder.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		module_row.add_child(placeholder)
		return
	for module in modules:
		var module_id = module.get("id", "")
		var btn = _module_button(module.get("name", module_id))
		btn.text = module.get("name", module_id)
		btn.toggle_mode = true
		btn.button_pressed = module_id == controller.selected_module_id
		btn.pressed.connect(_select_module.bind(module_id))
		module_row.add_child(btn)

func _refresh_facing_controls() -> void:
	if facing_row == null:
		return
	for child in facing_row.get_children():
		facing_row.remove_child(child)
		child.queue_free()
	if not controller.awaiting_facing:
		var placeholder = Label.new()
		placeholder.text = "朝向: %s" % _facing_label(controller.active_unit().facing if controller.active_unit() else "")
		placeholder.add_theme_font_size_override("font_size", 12)
		placeholder.add_theme_color_override("font_color", Palette.MUTED)
		placeholder.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		facing_row.add_child(placeholder)
		return
	var label = Label.new()
	label.text = "结束朝向"
	label.add_theme_font_size_override("font_size", 12)
	label.add_theme_color_override("font_color", Palette.TEXT)
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	facing_row.add_child(label)
	for entry in [["北", "N"], ["东", "E"], ["南", "S"], ["西", "W"]]:
		var btn = _module_button(entry[0])
		btn.custom_minimum_size = Vector2(42, 32)
		btn.pressed.connect(_confirm_facing.bind(entry[1]))
		facing_row.add_child(btn)

func _confirm_facing(dir: String) -> void:
	controller.confirm_facing(dir)
	AudioSettings.play_ui_click()
	_refresh_hud()

func _facing_label(facing: String) -> String:
	match facing:
		"N":
			return "北"
		"E":
			return "东"
		"S":
			return "南"
		"W":
			return "西"
	return "-"

func _module_button(text: String) -> Button:
	var btn = Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(74, 32)
	btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	btn.add_theme_font_size_override("font_size", 12)
	return btn

func _module_summary_text(summary: Dictionary, forecast: Dictionary, role_summary: Dictionary) -> String:
	var name = summary.get("name", "无")
	var pieces: Array = [
		"动作: %s" % name,
		"范围: %s" % summary.get("range", 0),
		"目标: %s" % summary.get("target_rule", "-")
	]
	if bool(summary.get("line_of_sight", false)):
		pieces.append("需视线")
	if int(summary.get("cost", 0)) > 0:
		pieces.append("消耗: %s" % summary.get("cost", 0))
	if not String(summary.get("effect", "")).is_empty():
		pieces.append("效果: %s" % summary.get("effect", ""))
	if not String(summary.get("unavailable_reason", "")).is_empty():
		pieces.append("不可用: %s" % summary.get("unavailable_reason", ""))
	var lines: Array = []
	if not role_summary.is_empty():
		lines.append("%s: %s" % [role_summary.get("title", ""), role_summary.get("summary", "")])
	lines.append(" | ".join(pieces))
	if not forecast.is_empty():
		lines.append(forecast.get("summary", ""))
	var combo_lines = controller.combo_eligibility_lines()
	if summary.get("mode", "") == "combo" and not combo_lines.is_empty():
		lines.append("连携: %s" % " | ".join(combo_lines))
	return "\n".join(lines)

func _event_banner_text(event: Dictionary, role_summary: Dictionary) -> String:
	if not event.is_empty():
		return "最近: %s" % event.get("summary", "")
	if not role_summary.is_empty():
		return "当前定位: %s | %s" % [role_summary.get("title", ""), role_summary.get("summary", "")]
	return "最近: 暂无战斗事件"

func _toggle_debug() -> void:
	debug_visible = not debug_visible
	if diagnostics_panel:
		diagnostics_panel.visible = debug_visible
	_refresh_hud()

func _build_diagnostics_text() -> String:
	var snap = controller.diagnostics_snapshot()
	var active = snap.get("active", {})
	var selected_tile = snap.get("selected_tile", {})
	var hovered_tile = snap.get("hovered_tile", {})
	var mission_state = snap.get("mission", {})
	var lines: Array = [
		"[诊断]",
		"行动顺序: %s" % " ".join(snap.get("turn_order", [])),
		"当前单位: %s %s 生命%s/%s 移动:%s 行动:%s 道具:%s 位置:%s" % [
			active.get("control", ""),
			active.get("label", "none"),
			active.get("hp", "-"),
			active.get("max_hp", "-"),
			active.get("can_move", false),
			active.get("can_act", false),
			active.get("can_use_tool", false),
			active.get("pos", "")
		],
		"CT顺序: %s" % " ".join(snap.get("turn_order", [])),
		"朝向确认: %s 当前:%s" % [snap.get("awaiting_facing", false), snap.get("selected_facing", "")],
		"选中格: %s 悬停格: %s" % [selected_tile, hovered_tile],
		"模式: %s 模块: %s" % [snap.get("mode", ""), snap.get("selected_module", {}).get("name", "")],
		"预览: 可移动%s 射程%s 可目标%s 路径%s" % [snap.get("move_preview_count", 0), snap.get("range_preview_count", 0), snap.get("target_preview_count", 0), snap.get("selected_path", [])],
		"预判: %s" % snap.get("forecast", {}).get("summary", ""),
		"最近事件: %s" % snap.get("recent_event", {}).get("summary", ""),
		"定位: %s" % snap.get("role_summary", {}).get("summary", ""),
		"任务: 目标=%s 撤离=%s 压力=%s 崩塌=%s" % [
			mission_state.get("objective_complete", false),
			mission_state.get("extraction_unlocked", false),
			mission_state.get("pressure_stage", 0),
			mission_state.get("collapsed", false)
		],
		"连携: %s 可用: %s" % [snap.get("combo", 0), snap.get("combo_eligibility", [])],
		"无效: %s" % snap.get("invalid_reason", ""),
		"日志: %s" % " | ".join(snap.get("log", []))
	]
	return "\n".join(lines)

func _on_finished(_result: Dictionary) -> void:
	await get_tree().create_timer(0.5).timeout
	SceneRouter.go("result")
