import { RequiredDataFromCollectionSlug } from 'payload'

import { bulletList, heading, paragraph, richText } from './richtext-helpers'

type CategoryIds = {
  capacitor?: number
  connectors?: number
  diode?: number
  inductor?: number
  resistor?: number
}

const introHero = (title: string, intro: string) => ({
  type: 'lowImpact' as const,
  richText: richText([heading(title, 'h1'), paragraph(intro)]),
})

export const resistorGuideData: (ids: CategoryIds) => RequiredDataFromCollectionSlug<'guides'> = ({
  resistor,
}) => ({
  slug: 'resistor-color-code-guide',
  _status: 'published',
  title: 'How to Read Resistor Color Codes (4-Band & 5-Band)',
  excerpt: 'A quick reference for decoding resistor color bands into resistance and tolerance values.',
  contentType: 'article',
  relatedCategory: resistor,
  hero: introHero(
    'How to Read Resistor Color Codes',
    'Every resistor\'s value is hiding in plain sight, in the colored bands painted around its body. Here\'s how to decode them without reaching for a multimeter.',
  ),
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: richText([
            heading('Why Resistors Use Color Bands'),
            paragraph(
              'Through-hole resistors are usually too small to print numbers on legibly, so manufacturers use a standardized color code instead. Once you know the sequence, you can read a resistor\'s value from across the workbench.',
            ),
            heading('4-Band Resistors'),
            paragraph(
              'The most common type. The first two bands are significant digits, the third is a multiplier, and the fourth is the tolerance.',
            ),
            bulletList([
              'Band 1 & 2: first two digits of the value',
              'Band 3: multiplier (how many zeros to add)',
              'Band 4: tolerance — gold (±5%) or silver (±10%)',
            ]),
            heading('5-Band Resistors'),
            paragraph(
              'Used for tighter-tolerance parts. Three significant digit bands instead of two, giving more precision before the multiplier and tolerance bands.',
            ),
            bulletList([
              'Band 1, 2 & 3: three digits of the value',
              'Band 4: multiplier',
              'Band 5: tolerance — brown (±1%) is the most common on 5-band resistors',
            ]),
            heading('The Color-to-Number Key'),
            bulletList([
              'Black = 0, Brown = 1, Red = 2, Orange = 3, Yellow = 4',
              'Green = 5, Blue = 6, Violet = 7, Grey = 8, White = 9',
            ]),
            heading('Quick Tips'),
            bulletList([
              'The tolerance band is usually spaced slightly apart from the others — start reading from the opposite end',
              'When in doubt, verify with a multimeter\'s resistance mode before soldering into a sensitive circuit',
              'Every resistor listing on Picmychip shows the verified resistance and tolerance in the spec sheet, so you never have to guess',
            ]),
          ]),
        },
      ],
    },
  ],
  meta: {
    title: 'How to Read Resistor Color Codes | Picmychip Guides',
    description: 'A quick reference for decoding 4-band and 5-band resistor color codes into resistance and tolerance values.',
  },
})

export const capacitorGuideData: (ids: CategoryIds) => RequiredDataFromCollectionSlug<'guides'> = ({
  capacitor,
}) => ({
  slug: 'capacitor-types-explained',
  _status: 'published',
  title: 'Capacitor Types Explained: Ceramic vs Electrolytic vs Tantalum',
  excerpt: 'What each capacitor family is good at, and how to pick the right one for your circuit.',
  contentType: 'article',
  relatedCategory: capacitor,
  hero: introHero(
    'Capacitor Types Explained',
    'Not all capacitors are interchangeable. Picking the wrong family can mean a circuit that drifts out of spec — or, with electrolytics, a part that fails outright if you get the polarity wrong.',
  ),
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: richText([
            heading('What a Capacitor Does'),
            paragraph(
              'A capacitor stores and releases electrical energy, smoothing out voltage ripples, filtering noise, and timing circuits. The material used to build it determines its capacitance range, voltage tolerance, size, and lifespan.',
            ),
            heading('Ceramic Capacitors'),
            paragraph(
              'Small, cheap, and non-polarized — you can insert them either way round. Great for decoupling and filtering in the pF to low-µF range. They\'re the default choice for most digital circuits.',
            ),
            heading('Electrolytic Capacitors'),
            paragraph(
              'Polarized — the longer lead (or the side without the stripe) is positive. They cover much larger capacitance values (µF to mF), making them the go-to for power supply smoothing. Reversing polarity can cause the capacitor to fail, sometimes venting or bulging, so always check orientation before powering on.',
            ),
            heading('Tantalum Capacitors'),
            paragraph(
              'Also polarized, but more stable and compact than electrolytics for a given capacitance — common in space-constrained boards. They\'re less tolerant of voltage spikes than electrolytics, so derate the voltage rating (use a part rated well above your circuit\'s actual voltage).',
            ),
            heading('How to Choose'),
            bulletList([
              'Filtering high-frequency noise near an IC → ceramic',
              'Smoothing a power supply rail → electrolytic',
              'Compact, stable filtering on a tight board → tantalum',
              'Always check the voltage rating is comfortably above your circuit\'s working voltage',
            ]),
          ]),
        },
      ],
    },
  ],
  meta: {
    title: 'Capacitor Types Explained | Picmychip Guides',
    description: 'Ceramic vs electrolytic vs tantalum capacitors — what each is good at and how to choose.',
  },
})

export const diodeGuideData: (ids: CategoryIds) => RequiredDataFromCollectionSlug<'guides'> = ({
  diode,
}) => ({
  slug: 'diode-basics-polarity-and-types',
  _status: 'published',
  title: 'Diode Basics: Polarity, Types, and How to Test One',
  excerpt: 'How to read diode polarity markings, tell diode types apart, and check one with a multimeter.',
  contentType: 'article',
  relatedCategory: diode,
  hero: introHero(
    'Diode Basics',
    'A diode only lets current flow one way — get the orientation wrong and, depending on the circuit, it either does nothing or fails immediately. Here\'s how to read one correctly.',
  ),
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: richText([
            heading('Reading Polarity'),
            paragraph(
              'Every diode has a cathode (the negative side) marked with a stripe or band on the body. Current flows from anode to cathode when the diode is forward-biased. In a schematic, the diode symbol\'s flat line — the same side the physical stripe is on — is the cathode.',
            ),
            heading('Common Diode Types'),
            bulletList([
              'Rectifier diodes — general-purpose, used to convert AC to DC or block reverse current',
              'Zener diodes — designed to conduct in reverse above a specific voltage, used for voltage regulation and protection',
              'Schottky diodes — low forward-voltage drop and fast switching, common in power supplies',
              'LEDs — technically diodes too; the longer lead (or the flat edge on the housing) is the anode',
            ]),
            heading('Testing a Diode with a Multimeter'),
            paragraph(
              'Switch your multimeter to diode-test mode (the diode symbol). Connect red to the anode and black to the cathode — a good diode reads roughly 0.3–0.7V forward voltage drop. Reverse the leads and it should read open (OL). A reading of 0V or OL in both directions means the diode has failed.',
            ),
            heading('Common Mistakes'),
            bulletList([
              'Installing an LED backwards — it simply won\'t light, it isn\'t usually damaged',
              'Reversing a rectifier diode in a power path — can short the supply or let current flow the wrong way entirely',
              'Confusing a Zener\'s reverse breakdown voltage with a forward voltage drop when reading a datasheet',
            ]),
          ]),
        },
      ],
    },
  ],
  meta: {
    title: 'Diode Basics: Polarity & Types | Picmychip Guides',
    description: 'How to read diode polarity markings, tell diode types apart, and test one with a multimeter.',
  },
})

export const inductorGuideData: (ids: CategoryIds) => RequiredDataFromCollectionSlug<'guides'> = ({
  inductor,
}) => ({
  slug: 'inductors-101',
  _status: 'published',
  title: 'Inductors 101: What They Do and How to Choose One',
  excerpt: 'The role inductors play in a circuit, the specs that matter, and how to pick the right one.',
  contentType: 'article',
  relatedCategory: inductor,
  hero: introHero(
    'Inductors 101',
    'Inductors are the quiet workhorse of power circuits — resisting changes in current, storing energy in a magnetic field, and filtering noise. Here\'s what to look for when picking one.',
  ),
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: richText([
            heading('What an Inductor Does'),
            paragraph(
              'An inductor resists changes in current flow, storing energy in a magnetic field when current increases and releasing it when current drops. That makes it essential in switching power supplies, filters, and anywhere you need to smooth out current spikes.',
            ),
            heading('Specs That Matter'),
            bulletList([
              'Inductance (µH or mH) — how strongly it resists current changes',
              'Rated current — the maximum current before the core saturates and inductance drops off',
              'DC resistance (DCR) — series resistance of the winding; lower is more efficient',
              'Self-resonant frequency — the point where the inductor stops behaving like one',
            ]),
            heading('Common Types'),
            bulletList([
              'Toroidal — wound on a ring core, low EMI radiation, common in power supplies',
              'Wirewound (radial/axial) — simple, general purpose',
              'SMD power inductors — compact, used on space-constrained boards like DC-DC converters',
            ]),
            heading('Choosing the Right One'),
            paragraph(
              'Match the inductance value to your circuit\'s design (often specified by a regulator IC\'s datasheet), then size the current rating with headroom above your circuit\'s peak current — running an inductor near its saturation current causes it to lose inductance exactly when you need it most.',
            ),
          ]),
        },
      ],
    },
  ],
  meta: {
    title: 'Inductors 101 | Picmychip Guides',
    description: 'What inductors do in a circuit, the specs that matter, and how to choose the right one.',
  },
})

export const connectorGuideData: (ids: CategoryIds) => RequiredDataFromCollectionSlug<'guides'> = ({
  connectors,
}) => ({
  slug: 'connector-selection-guide',
  _status: 'published',
  title: 'Connector Selection Guide: JST, USB, and Board-to-Board',
  excerpt: 'How to match connector pitch, type, and gender so your build fits together the first time.',
  contentType: 'article',
  relatedCategory: connectors,
  hero: introHero(
    'Connector Selection Guide',
    'A mismatched connector is one of the most common — and most avoidable — build mistakes. Here\'s how to choose the right one before you order.',
  ),
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: richText([
            heading('Why Connector Choice Matters'),
            paragraph(
              'Connectors need to match on three things to mate correctly: pitch (the spacing between pins), pin count, and gender. Get any one wrong and the parts simply won\'t connect — or worse, they\'ll connect incorrectly and short pins that were never meant to touch.',
            ),
            heading('JST Connectors'),
            paragraph(
              'The most common connector family in hobbyist electronics, available in several pitches that are not interchangeable: JST-PH (2.0mm), JST-XH (2.5mm), and JST-SM (2.5mm, higher current). Always check the pitch in millimeters, not just the "JST" label, before ordering a mating half.',
            ),
            heading('USB Connectors'),
            bulletList([
              'USB-A — the familiar rectangular host-side connector',
              'USB-C — reversible, higher current capacity, now standard on most new devices',
              'Micro-USB — common on older peripherals and dev boards',
            ]),
            heading('Board-to-Board & Pin Headers'),
            paragraph(
              'Standard 2.54mm (0.1") pin headers are the default for prototyping and dev boards. Finer-pitch board-to-board connectors (1.0mm, 1.25mm) show up on compact production boards where space is tight.',
            ),
            heading('Avoiding Common Pitfalls'),
            bulletList([
              'Double-check pitch in millimeters — "JST" alone isn\'t a complete spec',
              'Confirm male/female orientation before ordering both halves',
              'Match the current rating to your actual load, not just the physical fit',
            ]),
          ]),
        },
      ],
    },
  ],
  meta: {
    title: 'Connector Selection Guide | Picmychip Guides',
    description: 'How to match connector pitch, type, and gender — JST, USB, and board-to-board headers explained.',
  },
})
