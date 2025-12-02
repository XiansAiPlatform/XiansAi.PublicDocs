# Timezone Configuration

This guide explains how to configure timezones for your agents using the Date/Time plugin. There are two recommended ways to set timezones, and you can use both together for fine-grained control.

## Overview

By default, agents are configured to use **UTC** timezone. You can override this behavior in two ways:

1. **RunnerOptions Configuration** - Set the timezone at the application level
2. **System Prompt Guardrails** - Add explicit timezone instructions in your agent's system prompt

Both methods are recommended and can be used together for maximum control.

## Configuring Timezone via RunnerOptions

Configure the timezone in your `Program.cs` file using `RunnerOptions`. This sets the default timezone that the agent will initially see (take as Local Time).

### Default Configuration (UTC)

```csharp
using XiansAi.Flow;
using XiansAi.Models;

var options = new RunnerOptions
{
    SystemScoped = false,
    TimeZone = Timezone.Utc
};
```

### Use Host Environment Timezone

To use the timezone of the server/hosted environment:

```csharp
using XiansAi.Flow;
using XiansAi.Models;

var options = new RunnerOptions
{
    SystemScoped = false,
    TimeZone = Timezone.HostEnvironment
};
```

### Set a Specific IANA Timezone

You can set the agent to any specific timezone by selecting from the available `Timezone` enum values:

```csharp
using XiansAi.Flow;
using XiansAi.Models;

var options = new RunnerOptions
{
    SystemScoped = false,
    TimeZone = Timezone.OsloTime  // Example: Norway (Oslo) time
};
```

## Setting Guardrails in System Prompt

Regardless of the timezone set in `RunnerOptions`, you can add explicit instructions in your agent's system prompt to enforce specific timezone behavior. This provides fine-grained control and helps prevent the agent from using unauthorized timezones.

### Example: Enforce a Single Timezone

```csharp
SystemPrompt = @"Your Task is to route to different agents based on the user's request.
*Always take the time zone as Norway(Oslo) time.* 
*Politely refuse any request involving any other timezone.*";
```

### Example: Allow Multiple Specific Timezones

```csharp
SystemPrompt = @"Your Task is to route to different agents based on the user's request.

*The user may reference only the following timezones: Norway (Oslo), Sri Lanka, Portugal.*
*If the user requests any other timezone, reject the request and restate the allowed list.*";
```

**Recommendation:** Always add guardrails to your system prompt when you need strict control over which timezones the agent can access or reference.

## Available Timezones

The following timezones are available for use in `RunnerOptions.TimeZone`:

**Special Options:** `Timezone.Utc`, `Timezone.HostEnvironment`

**North America:** EasternTime, CentralTime, MountainTime, PacificTime, AlaskaTime, HawaiiAleutianTime, HawaiiTime, ArizonaTime, TorontoTime, VancouverTime, MexicoCityTime, CancunTime, MeridaTime, MonterreyTime, MatamorosTime, MazatlanTime, ChihuahuaTime, OjinagaTime, HermosilloTime, TijuanaTime, BahiaBanderasTime, NassauTime, BarbadosTime, BelizeTime, CostaRicaTime, HavanaTime, SantoDomingoTime, ElSalvadorTime, GuatemalaTime, TegucigalpaTime, JamaicaTime, ManaguaTime, PanamaTime, PortAuPrinceTime, PuertoRicoTime, PortOfSpainTime, CuracaoTime, MartiniqueTime, MiquelonTime, StJohnsTime, HalifaxTime, GlaceBayTime, MonctonTime, GooseBayTime, BlancSablonTime, NipigonTime, ThunderBayTime, IqaluitTime, PangnirtungTime, AtikokanTime, WinnipegTime, RainyRiverTime, ResoluteTime, RankinInletTime, ReginaTime, SwiftCurrentTime, EdmontonTime, CambridgeBayTime, YellowknifeTime, InuvikTime, CrestonTime, DawsonCreekTime, FortNelsonTime, WhitehorseTime, DawsonTime, DetroitTime, LouisvilleTime, MonticelloTime, IndianapolisTime, VincennesTime, WinamacTime, MarengoTime, PetersburgTime, VevayTime, TellCityTime, KnoxTime, MenomineeTime, CenterTime, NewSalemTime, BeulahTime, BoiseTime, JuneauTime, SitkaTime, MetlakatlaTime, YakutatTime, NomeTime, LaPazTime, NoronhaTime, BelemTime, FortalezaTime, RecifeTime, AraguainaTime, MaceioTime, BahiaTime, CampoGrandeTime, CuiabaTime, SantaremTime, PortoVelhoTime, BoaVistaTime, ManausTime, EirunepeTime, RioBrancoTime, CordobaTime, SaltaTime, JujuyTime, TucumanTime, CatamarcaTime, LaRiojaTime, SanJuanTime, MendozaTime, SanLuisTime, RioGallegosTime, UshuaiaTime, PuntaArenasTime, EasterTime, GuyanaTime, AsuncionTime, ParamariboTime, MontevideoTime, BrasiliaTime, BuenosAiresTime, SantiagoTime, BogotaTime, CaracasTime, LimaTime

**Europe:** LondonTime, ParisTime, BerlinTime, RomeTime, MadridTime, AmsterdamTime, BrusselsTime, ViennaTime, StockholmTime, AthensTime, IstanbulTime, MoscowTime, KievTime, WarsawTime, ZurichTime, DublinTime, LisbonTime, AndorraTime, TiraneTime, MinskTime, PragueTime, CopenhagenTime, TallinnTime, HelsinkiTime, BudapestTime, RigaTime, VilniusTime, LuxembourgTime, MonacoTime, ChisinauTime, OsloTime, BucharestTime, BelgradeTime, SofiaTime, SimferopolTime, KaliningradTime, KirovTime, VolgogradTime, AstrakhanTime, SaratovTime, UlyanovskTime, SamaraTime, UzhgorodTime, ZaporozhyeTime, CanaryTime, CeutaTime, MadeiraTime, GibraltarTime

**Asia:** DubaiTime, IndiaTime, ChinaTime, TokyoTime, SeoulTime, HongKongTime, SingaporeTime, BangkokTime, JakartaTime, ManilaTime, TaipeiTime, KarachiTime, DhakaTime, KathmanduTime, TehranTime, BaghdadTime, JerusalemTime, RiyadhTime, KuwaitTime, BeirutTime, BakuTime, KabulTime, YerevanTime, ThimphuTime, BruneiTime, UrumqiTime, ColomboTime, TbilisiTime, MacauTime, PontianakTime, MakassarTime, JayapuraTime, AmmanTime, AlmatyTime, QyzylordaTime, QostanayTime, AqtobeTime, AqtauTime, AtyrauTime, OralTime, BishkekTime, VientianeTime, KualaLumpurTime, KuchingTime, YangonTime, PyongyangTime, MuscatTime, GazaTime, HebronTime, QatarTime, DamascusTime, DushanbeTime, AshgabatTime, SamarkandTime, TashkentTime, HoChiMinhTime, YekaterinburgTime, OmskTime, NovosibirskTime, BarnaulTime, TomskTime, NovokuznetskTime, KrasnoyarskTime, IrkutskTime, ChitaTime, YakutskTime, KhandygaTime, VladivostokTime, UstNeraTime, MagadanTime, SakhalinTime, SrednekolymskTime, KamchatkaTime, AnadyrTime, UlaanbaatarTime, HovdTime, ChoibalsanTime, NicosiaTime, FamagustaTime

**Africa:** CairoTime, JohannesburgTime, LagosTime, NairobiTime, CasablancaTime, AlgiersTime, AbidjanTime, AccraTime, BissauTime, ElAaiunTime, JubaTime, KhartoumTime, MaputoTime, MonroviaTime, NdjamenaTime, SaoTomeTime, TripoliTime, TunisTime, WindhoekTime

**Australia & Pacific:** SydneyTime, MelbourneTime, BrisbaneTime, PerthTime, AdelaideTime, DarwinTime, AucklandTime, FijiTime, GuamTime, LordHoweTime, MacquarieTime, HobartTime, BrokenHillTime, LindemanTime, EuclaTime, ChuukTime, PohnpeiTime, KosraeTime, NoumeaTime, NorfolkTime, NauruTime, NiueTime, PalauTime, PortMoresbyTime, BougainvilleTime, PitcairnTime, ChathamTime, RarotongaTime, GuadalcanalTime, TarawaTime, EnderburyTime, KiritimatiTime, MajuroTime, KwajaleinTime, TahitiTime, MarquesasTime, GambierTime, TongatapuTime, FakaofoTime, FunafutiTime, WakeTime, WallisTime, ApiaTime, DiliTime

**Atlantic:** ReykjavikTime, AzoresTime, BermudaTime, CapeVerdeTime, FaroeTime, StanleyTime, SouthGeorgiaTime

**Indian Ocean:** ChagosTime, ChristmasTime, CocosTime, KerguelenTime, MaheTime, MaldivesTime, MauritiusTime, ReunionTime

**Antarctica:** CaseyTime, DavisTime, DumontDUrvilleTime, MawsonTime, PalmerTime, RotheraTime, SyowaTime, TrollTime, VostokTime

> **Note:** All timezone values should be prefixed with `Timezone.` (e.g., `Timezone.OsloTime`, `Timezone.IndiaTime`).

## Best Practices

1. **Combine Both Methods**: Use `RunnerOptions` to set the default timezone and system prompt guardrails to enforce restrictions.

2. **Be Explicit**: Always clearly state in your system prompt which timezones are allowed or required.

3. **User Experience**: Provide clear error messages when rejecting unsupported timezone requests.

4. **Documentation**: Document the configured timezone(s) for your team to maintain consistency.

## Example: Complete Configuration

Here's a complete example combining both methods:

**Program.cs:**
```csharp
using XiansAi.Flow;
using XiansAi.Models;

var options = new RunnerOptions
{
    SystemScoped = false,
    TimeZone = Timezone.OsloTime
};

var agentTeam = new AgentTeam("My Agent Team", options);
```

**NorwayNewsAgent.cs:**
```csharp
public class NorwayNewsAgent : FlowBase
{
    public NorwayNewsAgent()
    {
        SystemPrompt = @"Your task is to fetch the lattest news in Norway.

        *Always use Norway (Oslo) time zone as the default.*
        *Politely refuse any requests involving other timezones.*";
    }
}
```

This configuration ensures that:
- The default timezone is Oslo (from `RunnerOptions`)
- The agent is explicitly instructed to only use Oslo time (from system prompt)
- Any attempts to use other timezones will be rejected

