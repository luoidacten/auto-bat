# CLAUDE.md — Hướng dẫn cho AI viết code dự án "Đấu Trường Luân Hồi" (Unity)

> Đặt tệp này ở **gốc dự án Unity**. Claude Code tự đọc `CLAUDE.md`; nếu dùng công cụ AI khác, chép nội dung này vào `AGENTS.md` hoặc phần "rules" của công cụ đó.
> Cùng thư mục cần có: `Docs/GDD.md` (thiết kế) và `Docs/NHAN_VAT.md` (số liệu nhân vật).

---

## 1. Dự án là gì
- Roguelite hành động nhìn từ trên xuống, chơi đơn, offline. Chọn 1 tướng, qua 3 màn phòng-nối-phòng, nhặt nâng cấp, đánh boss.
- Thiết kế: `Docs/GDD.md`. **Đọc mục liên quan trong GDD trước khi viết bất kỳ hệ thống nào.**
- Số liệu nhân vật, trang bị, vật phẩm, công thức: `Docs/NHAN_VAT.md`. **Không tự bịa số.** Thiếu số thì hỏi hoặc ghi `// TODO(số liệu): ...` và báo lại.
- Game được chuyển từ một bản web (JavaScript) — mục 9 hướng dẫn cách dịch một tướng từ mã web sang C#.

## 2. Ngôn ngữ trao đổi
- Trả lời người dùng bằng **tiếng Việt**.
- Tên lớp, biến, hàm, tệp: **tiếng Anh**. Chú thích trong mã: tiếng Việt hoặc tiếng Anh đều được, ngắn gọn, giải thích *vì sao*.
- Chữ hiển thị cho người chơi: **không viết cứng trong mã** — dùng bảng Unity Localization (khóa dạng `hero.elara.s1.name`).

## 3. Công nghệ [cố định, không đổi khi chưa hỏi]
- Unity 6 LTS, **URP**.
- **Input System** (mới), không dùng `Input.GetKey` cũ.
- **Cinemachine** cho camera, **AI Navigation (NavMesh)** cho quái tìm đường, **TextMeshPro** cho chữ, **Unity Localization**.
- Không cài gói bên thứ ba (Asset Store, DOTween, Odin, Zenject…) nếu người dùng chưa đồng ý.
- Không dùng DOTS/ECS ở bản đầu.

## 4. Cấu trúc thư mục
```
Assets/
  _Project/
    Scripts/
      Core/          // GameClock, Rng, EventBus, Pool, Save, Bootstrap
      Combat/        // Stats, Damage, Status, Projectile, Hitbox, Telegraph
      Units/         // Unit, Hero, Enemy, Movement, Controller
      Skills/        // SkillDefinition, SkillBehaviour, Targeting, Casting
      Heroes/        // Mỗi tướng 1 thư mục: Elara/, Borg/… (behaviour chiêu + nội tại)
      Upgrades/      // Talent, Boon, Item, Shard, hook
      AI/            // Enemy AI, Hero AI (tướng AI tinh anh)
      Run/           // RunState, Act/Room generation, Rewards, Shop, Events
      Meta/          // Tiến trình vĩnh viễn, mở khóa
      UI/
      Editor/        // Công cụ editor, nhập dữ liệu
    Data/            // ScriptableObject: Heroes/, Skills/, Items/, Boons/, Enemies/, Rooms/
    Prefabs/  Scenes/  Art/  Audio/  Localization/
  Tests/
    EditMode/        // test công thức, chỉ số, rng
    PlayMode/
Docs/  (GDD.md, NHAN_VAT.md)
```
Namespace theo thư mục: `Arena.Core`, `Arena.Combat`, `Arena.Skills`, `Arena.Heroes.Elara`…

## 5. Kiến trúc

### 5.1. Nguyên tắc chung
- **Dữ liệu tách khỏi logic:** số liệu nằm trong ScriptableObject; logic trong C# thuần hoặc MonoBehaviour mỏng.
- **Logic chiến đấu là C# thuần, test được** (không phụ thuộc MonoBehaviour): tính chỉ số, sát thương, hồi chiêu, trạng thái.
- **Thời gian:** mọi logic gameplay đọc thời gian từ `GameClock` (có tạm dừng, dừng hình hitstop, làm chậm). Không dùng trực tiếp `Time.time` trong gameplay.
- **Ngẫu nhiên:** mọi ngẫu nhiên gameplay qua `Rng` có hạt giống (một luồng cho sinh màn, một luồng cho chiến đấu, một luồng cho phần thưởng). **Cấm** `UnityEngine.Random` trong gameplay (được dùng cho hiệu ứng hình ảnh thuần).
- **Giao tiếp giữa hệ thống:** sự kiện C# (`event Action<...>`) hoặc `EventBus` có kiểu. Không dùng `SendMessage`, không `FindObjectOfType` lúc chạy.
- **Không cấp phát bộ nhớ mỗi khung hình** ở đường nóng (Update, va chạm, sát thương): không LINQ, không tạo list mới, không nối chuỗi; dùng pool và list tái sử dụng.

### 5.2. Chỉ số (Stats)
- `StatType` enum: MaxHp, MaxMana, ManaRegen, AttackDamage (SMVL), AbilityPower (SMPT), Armor, MagicResist, AttackSpeed, MoveSpeed, AttackRange, Crit, CritDamage, CooldownReduction, Lifesteal, Tenacity, ArmorPenPct, ArmorPenFlat, MagicPenPct, MagicPenFlat, PhysAmp, MagicAmp, DamageAmp, DamageReduction, Vulnerability, MaxGuardArmor (Hộ Giáp)…
- `StatBlock` giữ giá trị gốc theo cấp + danh sách `StatModifier { StatType, ModType (Flat/PercentAdd/PercentMult), value, source }`.
- Thứ tự tính: `(gốc + tổng Flat) × (1 + tổng PercentAdd) × tích(1 + PercentMult)`; sau đó kẹp giới hạn (CDR ≤ 40%, tốc đánh trong [0.2, 2.5]).
- Gốc theo cấp: `gốc + tăng_mỗi_cấp × (cấp − 1)`; máu nhân `PlayerHpMult` (GDD 5.1). Hằng số đặt trong `GameBalance` (ScriptableObject), không viết cứng.
- Đánh dấu "bẩn" khi modifier đổi, tính lại lười — không tính lại mỗi khung hình.

### 5.3. Đường ống sát thương
```csharp
public struct DamageInfo {
    public Unit Source; public Unit Owner;          // Owner: tướng sở hữu (đạn, ảo ảnh, pet → chủ)
    public float Amount; public DamageType Type;    // Physical, Magic, True
    public DamageTag Tag;                           // Auto, S1, S2, S3, S4, Sub, Passive, Item, Dot, Environment
    public bool IsCrit, IsAoe; public float BonusPen;
}
```
`DamageSystem.Apply(ref DamageInfo)` làm đúng thứ tự trong GDD 6.1:
1. Hook `OnDealDamage` của người đánh → `OnTakeDamage` của người nhận (được sửa `Amount`, đặt 0 để chặn).
2. ×1.4 nếu Tag = S4; × khuếch đại; × giảm/dễ tổn thương của mục tiêu.
3. Giảm theo kháng: `R = kháng × (1 − min(0.9, pen%)) − penFlat`, `R ≥ 0` → `× 100/(100+R)`; sát thương chuẩn bỏ qua.
4. Trừ Hộ Giáp → lá chắn → máu. Gọi `OnDamaged`, kiểm tra chết (`OnFatal` có thể chặn), `OnKill`.
5. Hút máu, số bay lên, hitstop.
- Chống đệ quy: hook gây sát thương tiếp được giới hạn độ sâu (bản web: 8).
- **Viết test EditMode** cho công thức này trước khi dùng.

### 5.4. Hook (sự kiện của tướng, trang bị, nâng cấp)
Giữ đúng tên với bản web để dịch dễ:

| Hook | Khi nào | Bản web |
|---|---|---|
| `OnInit` | Bắt đầu lượt / sinh ra | `init` |
| `OnTick(dt)` | Mỗi bước logic | `update` / `tick` |
| `OnBasicAttack(target, ref info)` | Trước đòn đánh thường | `onAuto` |
| `OnDealDamage(target, ref info)` | Trước khi gây sát thương | `onDeal` |
| `OnTakeDamage(attacker, ref info)` | Trước khi nhận sát thương | `onTake` |
| `OnAfterTakeDamage(attacker, info)` | Sau khi nhận | `afterTake` |
| `OnFatal(attacker, ref bool prevent)` | Sắp chết | `onFatal` |
| `OnKill(victim)` | Hạ được địch | `onKill` |
| `OnSkillCast(skillSlot)` | Sau khi dùng chiêu | `onSkill` |
| `OnBlock(attacker)` | Đỡ trọn đòn | `onBlock` |

- Nội tại tướng, trang bị, Thiên Phú, Ân Huệ, mảnh hồn đều là `IUnitHook` đăng ký vào `Unit.Hooks`. Thứ tự gọi: nội tại → trang bị → nâng cấp (theo thứ tự nhận).
- Gỡ hook khi mất trang bị / kết thúc lượt — không để rò.

### 5.5. Trạng thái (Status)
- `StatusType` enum theo danh sách GDD 6.2. `StatusInstance { type, duration, value, source, key }`.
- `key` dùng để làm mới/gỡ đúng hiệu ứng của một nguồn (bản web: `{ key: 'alice_box' }`).
- Khống chế: rút ngắn theo Tenacity (trừ Knockup). Boss/tinh anh: khống chế cứng trừ thanh Kiên Định thay vì áp trực tiếp (GDD 6.2).
- Trạng thái có thể đổi chỉ số (buff/slow/haste) → thêm/gỡ `StatModifier` tương ứng.

### 5.6. Chiêu (Skills)
- `SkillDefinition` (ScriptableObject): id, nameKey, descKey, icon, `float[] cooldownByRank`, `float[] manaByRank`, castTime, castWhileMoving, uninterruptible, charges, targeting (`Unit`, `Point`, `Direction`, `Self`), range, radius, projectileSpeed, `SkillBehaviour behaviour`.
- `SkillBehaviour`: lớp trừu tượng, mỗi chiêu một lớp con (`ElaraVolley`, `BorgGrabSlam`…). Gắn vào `SkillDefinition` bằng `[SerializeReference]`.
  ```csharp
  public abstract class SkillBehaviour {
      public virtual bool CanCast(SkillContext ctx) => true;
      public abstract void Execute(SkillContext ctx);      // = hàm use(m, u, ctx) bản web
      public virtual void OnRecast(SkillContext ctx) {}    // chiêu dùng lại (allowRecast)
  }
  public struct SkillContext { public Unit Caster; public int Rank; public Vector3 AimPoint; public Unit AimTarget; public SkillSlot Slot; }
  ```
- `SkillCaster` (trên Unit) lo: kiểm tra hồi chiêu/mana/trạng thái (câm lặng, choáng), thời gian thi triển, khóa chân, ngắt chiêu, tích lũy, dùng lại trong khung thời gian.
- Giá trị theo cấp chiêu: `ctx.ByRank(new[]{60f,95f,130f,165f,200f})` (bản web: `ctx.v([...])`).

### 5.7. Va chạm & vùng đánh
- Dùng `Physics.OverlapSphereNonAlloc` / `OverlapBoxNonAlloc` với buffer tái sử dụng, layer riêng cho Hero, Enemy, Projectile, Wall.
- Hàm tiện ích tương ứng bản web: `HitCircle(center, radius, filter, onHit)`, `HitCone(origin, dir, range, angle, …)`, `HitLine(from, to, width, …)`.
- Đạn: `Projectile` dùng pool, di chuyển trong logic bước cố định, kiểm tra va chạm bằng spherecast giữa vị trí cũ và mới (không để đạn nhanh xuyên qua).

### 5.8. Vùng cảnh báo (Telegraph)
- `TelegraphSystem.Show(shape, position, rotation, size, duration, onResolve)`: hình tròn, nón, chữ nhật, vành khăn.
- Vẽ bằng decal hoặc mesh phẳng với shader lấp đầy theo thời gian. `onResolve` gây hiệu ứng khi hết giờ.
- AI né đọc danh sách cảnh báo đang hoạt động từ hệ này.

### 5.9. AI
- **Quái:** máy trạng thái đơn giản (Idle → Chase → Attack → Skill → Flee/Leash), NavMeshAgent di chuyển, mỗi loại quái 1 `EnemyBrain` ScriptableObject cấu hình.
- **Boss:** máy trạng thái theo giai đoạn + danh sách chiêu có trọng số, hồi chiêu; luôn dùng TelegraphSystem.
- **Tướng AI (tinh anh / đồng minh):** dùng chấm điểm tiện ích (utility AI) — mỗi hành động (đánh, dùng chiêu X, né, rút lui, uống bình) có điểm theo tình huống, chọn cao nhất mỗi 0.1–0.25s. Dữ liệu gợi ý có sẵn trong mỗi chiêu bản web (`ai: { use, range, aim, … }`, xem dòng "Nhắm / Tầm AI / Mục đích AI" trong `NHAN_VAT.md`).
- Cùng một API điều khiển cho người chơi và AI: `IUnitController` phát lệnh `Move(dir)`, `Aim(point)`, `CastSkill(slot)`, `Dash()`. Tướng người chơi và tướng AI chỉ khác controller.

### 5.10. Lượt chơi
- `RunState` (C# thuần, tuần tự hóa được): hạt giống, màn hiện tại, sơ đồ màn, tướng, cấp, kinh nghiệm, điểm chiêu, Thiên Phú, trang bị, mảnh hồn, vàng, máu.
- `ActGenerator(seed)` → sơ đồ phòng; `RoomDirector` sinh đợt quái từ `RoomTemplate` + `WaveTable`.
- `RewardService` rút lựa chọn theo luật GDD 8.4 (trọng số nhãn, độ hiếm theo màn).
- Lưu: JSON có `version`; có lớp nâng cấp dữ liệu lưu cũ.

### 5.11. Hệ số chiêu (Scaling) — xem GDD 6.5–6.7
- `StatBlock` phải giữ **giá trị gốc theo cấp** riêng để tính "cộng thêm": `Bonus(stat) = Total(stat) − BaseFromLevel(stat)` (SMVL, Máu, Giáp, KP, Tốc đánh). SMPT gốc = 0.
- Không viết cứng hệ số trong `SkillBehaviour`. Mỗi lượng sát thương / hồi máu / lá chắn là một `ScaledValue` trong dữ liệu chiêu:
  ```csharp
  public enum ScalingSource {
      AttackDamageTotal, AttackDamageBonus, AbilityPower,
      MaxHealth, BonusHealth, ArmorBonus, MagicResistBonus,
      TargetMaxHealth, TargetMissingHealth, TargetCurrentHealth,
      BonusAttackSpeed, CritChance, HeroLevel, Stacks, Resource, Custom
  }
  [Serializable] public struct ScalingTerm {
      public ScalingSource Source; public float[] RatioByRank;   // 1 phần tử = mọi cấp như nhau
      public string CustomKey;                                    // cho Stacks / Resource / Custom (ví dụ "ignatius.burn_stacks")
  }
  [Serializable] public class ScaledValue {
      public string Id;                    // "s2.damage", "s3.shield"…
      public float[] BaseByRank; public float PerHeroLevel;
      public List<ScalingTerm> Terms;
      public DamageType Type;              // Physical / Magic / True (bỏ qua nếu là hồi máu, lá chắn)
      public bool CapVsMonsters;           // áp giới hạn GDD 6.6 cho hệ số % máu mục tiêu
      public float Evaluate(Unit caster, Unit target, int rank, IScalingContext ctx);
  }
  ```
- `SkillDefinition` có `List<ScaledValue> Values`; behaviour gọi `ctx.Value("s2.damage", target)` — không tự nhân chỉ số.
- Hệ số % máu mục tiêu tính **theo từng mục tiêu** lúc trúng, không tính trước khi tung chiêu.
- Tooltip sinh tự động từ `ScaledValue`: số đã tính theo chỉ số hiện tại; giữ Alt hiện từng hệ số với màu theo bảng GDD 6.6.
- Test EditMode: mỗi `ScalingSource` một test; một test cho giới hạn % máu với boss.
- **Chuyển công thức bản web:** bản web chỉ có `H.amt(u, gốc, hsSMVL, hsSMPT)` dùng **SMVL tổng**. Khi chuyển tướng, dùng bảng hệ số mới trong GDD 6.7 nếu tướng đã có; nếu chưa, giữ công thức web (AttackDamageTotal + AbilityPower) và ghi `// TODO(hệ số): chờ thiết kế theo GDD 6.6`.

### 5.12. Pool & hiệu năng
- Pool cho đạn, hiệu ứng, số sát thương, quái.
- Mục tiêu: 60 FPS PC, 30–60 FPS điện thoại tầm trung với 40 quái + 100 đạn trên màn.

## 6. Quy ước code
- C#: PascalCase cho lớp/hàm/thuộc tính, camelCase cho biến cục bộ, `_camelCase` cho trường private. Một lớp public mỗi tệp, tên tệp = tên lớp.
- `[SerializeField] private` thay vì trường public. Không dùng `public` field chỉ để hiện trên Inspector.
- Không dùng `GameObject.Find`, `FindObjectOfType` lúc chạy; tiêm tham chiếu qua Inspector hoặc `Bootstrap`.
- Không dùng singleton tràn lan: chỉ `GameServices` (truy cập Clock, Rng, EventBus, Pool, Save).
- Không bắt lỗi rồi nuốt im lặng; ghi `Debug.LogError` có ngữ cảnh.
- `#if UNITY_EDITOR` cho mã chỉ dùng trong editor; công cụ editor nằm trong `Editor/`.

## 7. Quy tắc làm việc cho AI
1. **Đọc trước khi viết:** mục GDD liên quan, `NHAN_VAT.md` cho tướng liên quan, và mã hiện có của hệ thống đó.
2. **Làm từng bước nhỏ**, mỗi bước chạy được. Không viết lại cả hệ thống khi chỉ cần sửa một phần.
3. **Không sửa trực tiếp tệp YAML** của Unity (`.unity`, `.prefab`, `.asset`) bằng chữ. Cần tạo prefab/asset thì viết **script Editor** (menu `Tools/Arena/...`) hoặc hướng dẫn người dùng thao tác trong Editor từng bước.
4. **Không đổi các mục [CỐ ĐỊNH] trong GDD.** Thấy cần đổi thì đề xuất, chờ đồng ý.
5. **Số liệu:** lấy từ `NHAN_VAT.md`; con số mới (cân bằng roguelite) đặt trong ScriptableObject `GameBalance` hoặc dữ liệu tướng, không viết cứng trong lớp hành vi.
6. **Test:** công thức (chỉ số, sát thương, hồi chiêu, luật cộng điểm, rút phần thưởng) phải có test EditMode. Chạy test trước khi báo xong.
7. **Báo cáo sau mỗi việc:** đã làm gì, tệp nào, cách thử trong Editor (bấm gì, thấy gì), còn thiếu gì.
8. Không xóa tệp/asset của người dùng khi chưa hỏi. Không commit hộ nếu người dùng chưa yêu cầu.
9. Gặp mâu thuẫn giữa GDD, `NHAN_VAT.md` và yêu cầu người dùng: **hỏi**, không tự chọn.

## 8. Định nghĩa "xong"
- Biên dịch không lỗi, không cảnh báo mới.
- Test EditMode liên quan qua.
- Chạy được trong Editor theo hướng dẫn đã báo.
- Không cấp phát mỗi khung hình ở đường nóng (kiểm tra Profiler nếu là hệ thống chạy liên tục).
- Chữ hiển thị nằm trong bảng dịch.

## 9. Dịch một tướng từ mã web sang Unity

### 9.1. Nguồn
- Hồ sơ tướng trong `Docs/NHAN_VAT.md`: chỉ số, mô tả chiêu, **công thức trong mã**, dòng mã nguồn.
- Mã gốc (nếu có trong máy): `auto-bat/src/data/heroes/<id>.js`.

### 9.2. Bảng đối chiếu API web → Unity

| Bản web (JS) | Ý nghĩa | Unity (C#) gợi ý |
|---|---|---|
| `H.def({...})` | Định nghĩa tướng | `HeroDefinition` ScriptableObject |
| `stats: { hp, hpG, ad, adG, … }` | Chỉ số gốc + tăng/cấp | `HeroDefinition.BaseStats` |
| `passive: { init, update, onAuto, onDeal, onTake, onFatal, onKill }` | Nội tại | Lớp `XxxPassive : IUnitHook` |
| `skills.s1.use(m, u, ctx)` | Thực thi chiêu | `SkillBehaviour.Execute(ctx)` |
| `ctx.v([a,b,c,d,e])` | Giá trị theo cấp chiêu | `ctx.ByRank(...)` |
| `ctx.pt` / `ctx.tgt` | Điểm / mục tiêu ngắm | `ctx.AimPoint` / `ctx.AimTarget` |
| `u.ws.xxx` | Trạng thái riêng của tướng | Trường trong lớp nội tại (`AlicePassive.Hype`) |
| `u.st.ad` / `u.st.ap` / `u.st.maxHp` | Chỉ số hiện tại | `unit.Stats[StatType.AttackDamage]`… |
| `u.level` | Cấp tướng | `unit.Level` |
| `H.amt(u, gốc, hsAD, hsAP)` | gốc + hsAD×SMVL tổng + hsAP×SMPT | `ScaledValue` trong dữ liệu chiêu (mục 5.11) — ưu tiên hệ số mới ở GDD 6.7 |
| `H.T(u, '3b')` | Đã có nhánh 3b | `unit.Upgrades.Has("elara.3b")` |
| `m.damage(u, e, amt, 'phys'/'magic'/'true', {tag})` | Gây sát thương | `DamageSystem.Apply(...)` |
| `m.heal(u, t, amt)` / `m.shield(t, amt, dur)` | Hồi máu / lá chắn | `HealSystem` / `ShieldSystem` |
| `m.addStatus(e, 'stun', dur, v, {src, key})` | Thêm trạng thái | `e.Status.Add(StatusType.Stun, dur, v, src, key)` |
| `m.removeStatus(u, type, key)` | Gỡ trạng thái | `Status.Remove(type, key)` |
| `m.hitCircle / hitCone / hitLine` | Đánh vùng | `Hit.Circle / Cone / Line` |
| `H.shoot(m, u, target, {speed, range, onHit})` / `m.proj` | Bắn đạn | `ProjectileSystem.Spawn(...)` |
| `m.dashTo(u, x, y, speed, {onContact})` | Lướt tới điểm | `Movement.Dash(target, speed, onContact)` |
| `m.blink(u, x, y)` | Dịch chuyển tức thời | `Movement.Teleport(pos)` |
| `m.knock(src, e, dx, dy, dist, dur)` / `m.knockup` | Đẩy lùi / hất tung | `Movement.Knockback` / `Status Knockup` |
| `m.zone({...})` | Vùng tồn tại theo thời gian | `ZoneSystem.Spawn(ZoneSpec)` |
| `m.telegraph(...)` | Vùng cảnh báo | `TelegraphSystem.Show(...)` |
| `m.later(sec, fn)` | Hẹn giờ | `Timers.After(sec, fn)` (theo GameClock, hủy khi chủ chết nếu cần) |
| `m.allowRecast(u, key, win)` | Cho dùng lại chiêu trong khung | `SkillCaster.OpenRecast(slot, window)` |
| `m.makeDecoy(u, x, y, {...})` | Tạo ảo ảnh | `DecoySystem.Spawn(...)` |
| `m.enemiesIn(team, x, y, r)` | Tìm địch trong vùng | `Query.EnemiesInRadius(...)` (buffer tái sử dụng) |
| `H.dirTo(a, b)` / `H.toward(u, pt, dist)` | Hướng / điểm cách N đv | `VectorUtil` |
| `m.fx({...})` | Hiệu ứng hình ảnh | `VfxService.Play(id, pos, …)` (không ảnh hưởng logic) |
| `G.C.*` | Hằng số | `GameBalance` ScriptableObject |

Lưu ý: bản web dùng mặt phẳng `(x, y)`; Unity dùng `(x, z)` với `y` là chiều cao.

### 9.3. Quy trình dịch một tướng
1. Tạo `HeroDefinition` + 5 `SkillDefinition` từ `NHAN_VAT.md` (dùng công cụ nhập dữ liệu nếu đã có).
2. Viết lớp nội tại (`XxxPassive`) — trạng thái riêng, hook.
3. Viết từng `SkillBehaviour`: đúng thứ tự hiệu ứng trong mã gốc; lượng sát thương/hồi/khiên khai báo bằng `ScaledValue` theo bảng hệ số GDD 6.7 (chưa có bảng thì dùng công thức web và ghi TODO).
4. Viết 15 Thiên Phú của tướng (cây tiến hóa) dạng `TalentDefinition` + hook/điều kiện `Has("id.3b")`.
5. Chiêu thiết kế cho đấu tướng (chỉ nhắm tướng, `heroOnly`) → đổi sang nhắm mọi kẻ địch, hoặc ghi chú để người dùng quyết định.
6. Thêm khóa dịch cho tên, mô tả.
7. Test: một test EditMode cho công thức sát thương của từng chiêu; thử trong cảnh **Sandbox** (bù nhìn đứng yên + đo DPS).
8. Báo lại những chỗ khác bản web và lý do.

## 10. Công cụ nên làm sớm
- **Cảnh Sandbox:** thả bù nhìn, chọn tướng, đặt cấp, cho Thiên Phú/trang bị bất kỳ, bật/tắt hồi chiêu, hiện DPS. Dùng để thử mọi tướng và cân bằng.
- **Bảng debug trong trận** (phím F1): bất tử, thêm vàng, nhảy phòng, chọn Thiên Phú, sinh quái.
- **Công cụ nhập dữ liệu** (Editor): đọc bảng chỉ số / chiêu / trang bị (CSV hoặc JSON xuất từ bản web) → tạo/cập nhật ScriptableObject.

## 11. Mẫu yêu cầu người dùng có thể giao cho AI
- "Làm mốc M0 trong GDD mục 15.2: di chuyển WASD, camera Cinemachine, lướt né chung, đánh thường cận chiến, 1 quái bù nhìn. Kèm test EditMode cho StatBlock và DamageSystem."
- "Dịch tướng Elara theo CLAUDE.md mục 9.3. Số liệu trong Docs/NHAN_VAT.md mục Elara."
- "Làm hệ Thiên Phú và màn chọn 3 lựa chọn theo GDD 8.2–8.4."
- "Làm Boss Tân Thế theo GDD 10.4, dùng TelegraphSystem, có giai đoạn 2."
