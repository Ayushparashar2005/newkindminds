"""
Initial reference data for KindMinds (India).

Everything here is real public information: government agencies and NGOs that
actually operate in India, real hospitals / civic offices with their real
addresses and coordinates, real national helplines, real NDRF battalions and
real IMD / NDMA / CAQM hazard seasons. No invented phone numbers are used:
where a facility's direct line is not published reliably we point to the
official national number (108 / 102 / 112 / 1913 / 1916 ...).

The few assistance requests seeded below are sample tickets so the Helper
triage flow has something to work on; they carry no personal names or phone
numbers. Facility stock (inventory) is intentionally NOT seeded: helpers add
real stock counts from the Resources page.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db, Base, engine
from backend.app.models.entities import (
    User,
    HelperProfile,
    Organization,
    DisasterEvent,
    HumanitarianResource,
    ResourceInventory,
    SearchGroup,
    AssistanceRequest,
    SOPDocument,
    PreparednessChecklistModel,
    MentalHealthJournal,
    MentalHealthAssessment,
)

router = APIRouter(prefix="/seed", tags=["Seed & Reference Data"])


def _add(db: Session, *objs):
    db.add_all(objs)
    db.commit()
    for o in objs:
        db.refresh(o)
    return objs


@router.post("/demo")
def seed_demo_data(force: bool = False, db: Session = Depends(get_db)):
    """Seeds India reference data. `force=true` wipes and reseeds."""
    Base.metadata.create_all(bind=engine)

    existing = db.query(DisasterEvent).count()
    if existing > 0 and not force:
        return {"message": "Reference data already seeded", "count": existing}

    if force:
        for model in (ResourceInventory, HumanitarianResource, SearchGroup, AssistanceRequest,
                      SOPDocument, PreparednessChecklistModel, MentalHealthJournal,
                      MentalHealthAssessment, DisasterEvent, Organization, HelperProfile, User):
            db.query(model).delete()
        db.commit()

    # ------------------------------------------------------------------ users
    citizen, responder = _add(
        db,
        User(email="citizen@kindminds.local", display_name="Citizen (this device)",
             active_panel="needer", is_verified_helper=False),
        User(email="responder@kindminds.local", display_name="Responder (this device)",
             active_panel="helper", is_verified_helper=True, helper_type="ngo"),
    )
    db.add(HelperProfile(
        user_id=responder.id, helper_type="ngo", verification_status="pending",
        service_categories=["medical", "shelter", "food", "water"],
        geographic_coverage=["India"], public_contact=None,
    ))

    # ---------------------------------------------------------- organizations
    ndrf, ircs, goonj, seeds, dfy, nimhans, gcc, osdma = _add(
        db,
        Organization(
            name="National Disaster Response Force (NDRF)",
            organization_type="Government, Ministry of Home Affairs",
            description="India's specialised disaster response force, constituted under the Disaster Management Act, 2005. "
                        "Battalions are pre-positioned across the country for flood/water rescue, collapsed-structure search & rescue (CSSR), "
                        "medical first response and CBRN emergencies.",
            assistance_categories=["evacuation", "missing_person", "medical", "transportation"],
            geographic_coverage=["National (16 battalions)"],
            public_contact="Emergency: 112 (ERSS)",
            website="https://ndrf.gov.in",
            verification_status="verified", operational_status="active", is_demo=False,
        ),
        Organization(
            name="Indian Red Cross Society",
            organization_type="Statutory Humanitarian Organisation (est. 1920)",
            description="Part of the International Red Cross & Red Crescent Movement with branches in every state. "
                        "Provides disaster relief supplies, first aid, blood services, restoring family links and psychosocial support.",
            assistance_categories=["medical", "shelter", "essential_supplies", "family_reunification"],
            geographic_coverage=["National (state & district branches)"],
            public_contact="Via state branch, indianredcross.org",
            website="https://www.indianredcross.org",
            verification_status="verified", operational_status="active", is_demo=False,
        ),
        Organization(
            name="Goonj",
            organization_type="NGO, Disaster Relief & Rehabilitation",
            description="Delhi-based NGO (Ramon Magsaysay Award 2015) running the 'Rahat' disaster relief programme: "
                        "family kits of dry ration, clothing, hygiene and shelter material, followed by community-led rebuilding.",
            assistance_categories=["essential_supplies", "food", "shelter"],
            geographic_coverage=["Pan-India"],
            public_contact="Via goonj.org",
            website="https://goonj.org",
            verification_status="verified", operational_status="active", is_demo=False,
        ),
        Organization(
            name="SEEDS (Sustainable Environment and Ecological Development Society)",
            organization_type="NGO, Disaster Resilience & Shelter",
            description="Works on disaster preparedness, emergency response and resilient shelter reconstruction with "
                        "vulnerable communities across India.",
            assistance_categories=["shelter", "essential_supplies", "disability"],
            geographic_coverage=["Pan-India"],
            public_contact="Via seedsindia.org",
            website="https://www.seedsindia.org",
            verification_status="verified", operational_status="active", is_demo=False,
        ),
        Organization(
            name="Doctors For You",
            organization_type="Medical Humanitarian NGO",
            description="Mumbai-based medical humanitarian organisation providing emergency medical camps, mobile clinics and "
                        "health services in disaster-affected and underserved areas.",
            assistance_categories=["medical", "mental_health"],
            geographic_coverage=["Pan-India"],
            public_contact="Via doctorsforyou.org",
            website="https://doctorsforyou.org",
            verification_status="verified", operational_status="active", is_demo=False,
        ),
        Organization(
            name="NIMHANS, Tele-MANAS",
            organization_type="Government, Ministry of Health & Family Welfare",
            description="National Institute of Mental Health and Neuro-Sciences, Bengaluru, is the technical hub for Tele-MANAS, "
                        "the free 24x7 national tele-mental-health helpline (14416) available in multiple Indian languages.",
            assistance_categories=["mental_health"],
            geographic_coverage=["National"],
            public_contact="Tele-MANAS: 14416 / 1-800-891-4416",
            website="https://telemanas.mohfw.gov.in",
            verification_status="verified", operational_status="active", is_demo=False,
        ),
        Organization(
            name="Greater Chennai Corporation",
            organization_type="Urban Local Body, Disaster Management",
            description="Municipal corporation of Chennai. Operates the monsoon control room, ward-level relief centres, "
                        "community kitchens and dewatering operations during the northeast monsoon.",
            assistance_categories=["shelter", "food", "water", "evacuation"],
            geographic_coverage=["Chennai (15 zones, 200 wards)"],
            public_contact="Helpline: 1913",
            website="https://chennaicorporation.gov.in",
            verification_status="verified", operational_status="active", is_demo=False,
        ),
        Organization(
            name="Odisha State Disaster Management Authority (OSDMA)",
            organization_type="Government, State Disaster Management Authority",
            description="Nodal agency for disaster management in Odisha; runs the state's network of multipurpose cyclone & flood "
                        "shelters and the Odisha Disaster Rapid Action Force (ODRAF).",
            assistance_categories=["evacuation", "shelter", "food"],
            geographic_coverage=["Odisha"],
            public_contact="Emergency: 112",
            website="https://www.osdma.org",
            verification_status="verified", operational_status="active", is_demo=False,
        ),
    )

    # -------------------------------------------------------------- disasters
    ne_monsoon, bob_cyclone, delhi_air, wayanad, biparjoy = _add(
        db,
        DisasterEvent(
            name="Northeast Monsoon 2026, Tamil Nadu & Puducherry",
            category="flood",
            description="The October–December northeast monsoon brings most of Tamil Nadu's annual rainfall. Low-lying parts of Chennai "
                        "(Velachery, Pallikaranai, Mudichur, Tambaram, Perungudi) are prone to waterlogging and urban flooding. "
                        "Follow IMD Chennai nowcasts and Greater Chennai Corporation advisories.",
            region="Tamil Nadu & Puducherry",
            severity="severe", status="active", lifecycle_stage="preparedness",
            source="India Meteorological Department, Regional Meteorological Centre, Chennai",
            latitude=13.0827, longitude=80.2707,
            affected_population=4646732,  # Chennai district, Census 2011
            is_demo=False,
        ),
        DisasterEvent(
            name="Post-Monsoon Cyclone Season, Bay of Bengal",
            category="cyclone",
            description="October–December is a peak tropical-cyclone season over the Bay of Bengal (e.g. Phailin, Oct 2013; Hudhud, Oct 2014). "
                        "Coastal Odisha, Andhra Pradesh and West Bengal should track IMD cyclone bulletins and keep evacuation plans ready.",
            region="Odisha, Andhra Pradesh & West Bengal coasts",
            severity="moderate", status="active", lifecycle_stage="preparedness",
            source="IMD, Regional Specialised Meteorological Centre (Tropical Cyclones), New Delhi",
            latitude=19.8135, longitude=85.8312,
            affected_population=0,
            is_demo=False,
        ),
        DisasterEvent(
            name="Winter Air Pollution, Delhi NCR (GRAP in force)",
            category="other",
            description="Every winter (Oct–Jan) stubble burning, low wind and temperature inversion push Delhi NCR's AQI into the 'Very Poor' "
                        "and 'Severe' bands. The Graded Response Action Plan (GRAP) stages are enforced by CAQM. Children, elderly and people "
                        "with heart or lung disease should limit outdoor exposure.",
            region="Delhi NCR",
            severity="severe", status="active", lifecycle_stage="response",
            source="Commission for Air Quality Management (CAQM) & Central Pollution Control Board (CPCB)",
            latitude=28.6139, longitude=77.2090,
            affected_population=16787941,  # NCT of Delhi, Census 2011
            is_demo=False,
        ),
        DisasterEvent(
            name="Wayanad Landslides (30 July 2024)",
            category="landslide",
            description="Multiple landslides after extreme rainfall struck Mundakkai, Chooralmala and Punchirimattom in Meppadi panchayat, "
                        "Wayanad, killing more than 200 people. Rehabilitation and township reconstruction are ongoing.",
            region="Meppadi, Wayanad, Kerala",
            severity="critical", status="recovered", lifecycle_stage="recovery",
            source="Kerala State Disaster Management Authority (KSDMA)",
            latitude=11.4870, longitude=76.1430,
            affected_population=0,
            is_demo=False,
        ),
        DisasterEvent(
            name="Cyclone Biparjoy (landfall 15 June 2023)",
            category="cyclone",
            description="Very Severe Cyclonic Storm Biparjoy made landfall near Jakhau Port, Kutch. Over one lakh people were evacuated "
                        "in Gujarat ahead of landfall.",
            region="Kutch & Saurashtra, Gujarat",
            severity="critical", status="recovered", lifecycle_stage="recovery",
            source="India Meteorological Department & Gujarat State Disaster Management Authority",
            latitude=23.2170, longitude=68.7170,
            affected_population=0,
            is_demo=False,
        ),
    )

    # -------------------------------------------------- facilities / resources
    res = _add(
        db,
        HumanitarianResource(
            name="Rajiv Gandhi Government General Hospital",
            category="medical", sub_category="Government Tertiary Hospital (24x7 Emergency)",
            disaster_id=ne_monsoon.id,
            address_approximate="Poonamallee High Road, Park Town, Chennai 600003",
            latitude=13.0815, longitude=80.2774,
            operational_status="available", visibility="public",
            accessibility_features=["24x7 Casualty / Emergency"],
            contact_public="Ambulance: 108",
            source_attribution="Health & Family Welfare Department, Govt. of Tamil Nadu",
            is_demo=False,
        ),
        HumanitarianResource(
            name="Government Stanley Medical College Hospital",
            category="medical", sub_category="Government Tertiary Hospital (24x7 Emergency)",
            disaster_id=ne_monsoon.id,
            address_approximate="Old Jail Road, Royapuram, Chennai 600001",
            latitude=13.1067, longitude=80.2862,
            operational_status="available", visibility="public",
            accessibility_features=["24x7 Casualty / Emergency"],
            contact_public="Ambulance: 108",
            source_attribution="Health & Family Welfare Department, Govt. of Tamil Nadu",
            is_demo=False,
        ),
        HumanitarianResource(
            name="GCC Monsoon Relief Centres (ward-level)",
            category="shelter", sub_category="Notified relief centres in schools and community halls",
            disaster_id=ne_monsoon.id, organization_id=gcc.id,
            address_approximate="Ripon Building, Park Town, Chennai 600003 (call 1913 for nearest centre)",
            latitude=13.0827, longitude=80.2707,
            operational_status="available", visibility="public",
            accessibility_features=["Nearest open centre shared on helpline 1913"],
            contact_public="Helpline: 1913",
            source_attribution="Greater Chennai Corporation",
            is_demo=False,
        ),
        HumanitarianResource(
            name="Amma Unavagam, Community Canteens",
            category="food", sub_category="Subsidised hot meals (ward-level canteens)",
            disaster_id=ne_monsoon.id, organization_id=gcc.id,
            address_approximate="Ward-level canteens across Chennai (GCC)",
            latitude=13.0760, longitude=80.2650,
            operational_status="available", visibility="public",
            accessibility_features=["Low-cost meals", "Multiple ward locations"],
            contact_public="Helpline: 1913",
            source_attribution="Greater Chennai Corporation",
            is_demo=False,
        ),
        HumanitarianResource(
            name="Chennai Metro Water (CMWSSB), Water Supply & Tanker Cell",
            category="water", sub_category="Drinking-water supply & tanker requests",
            disaster_id=ne_monsoon.id,
            address_approximate="No. 1, Pumping Station Road, Chintadripet, Chennai 600002",
            latitude=13.0732, longitude=80.2702,
            operational_status="available", visibility="public",
            accessibility_features=["Phone complaint registration"],
            contact_public="044-4567 4567",
            source_attribution="Chennai Metropolitan Water Supply & Sewerage Board",
            is_demo=False,
        ),
        HumanitarianResource(
            name="Indian Red Cross Society, Tamil Nadu State Branch",
            category="warehouse", sub_category="Relief material store",
            disaster_id=ne_monsoon.id, organization_id=ircs.id,
            address_approximate="Red Cross Building, 32 Montieth Road, Egmore, Chennai 600008",
            latitude=13.0705, longitude=80.2610,
            operational_status="available", visibility="verified_helpers",
            accessibility_features=[],
            contact_public="Via indianredcross.org",
            source_attribution="Indian Red Cross Society",
            is_demo=False,
        ),
        HumanitarianResource(
            name="SCB Medical College & Hospital",
            category="medical", sub_category="Government Tertiary Hospital (24x7 Emergency)",
            disaster_id=bob_cyclone.id,
            address_approximate="Mangalabag, Cuttack, Odisha 753007",
            latitude=20.4729, longitude=85.8915,
            operational_status="available", visibility="public",
            accessibility_features=["24x7 Casualty / Emergency"],
            contact_public="Ambulance: 108",
            source_attribution="Health & Family Welfare Department, Govt. of Odisha",
            is_demo=False,
        ),
        HumanitarianResource(
            name="OSDMA Multipurpose Cyclone & Flood Shelters",
            category="shelter", sub_category="Cyclone shelters across coastal districts",
            disaster_id=bob_cyclone.id, organization_id=osdma.id,
            address_approximate="Coastal districts of Odisha (Puri, Ganjam, Jagatsinghpur, Kendrapara, Balasore, Bhadrak)",
            latitude=19.8100, longitude=85.8300,
            operational_status="available", visibility="public",
            accessibility_features=["Opened by district administration on cyclone warning"],
            contact_public="Emergency: 112",
            source_attribution="Odisha State Disaster Management Authority",
            is_demo=False,
        ),
        HumanitarianResource(
            name="All India Institute of Medical Sciences (AIIMS), New Delhi",
            category="medical", sub_category="Central Government Tertiary Hospital (24x7 Emergency)",
            disaster_id=delhi_air.id,
            address_approximate="Ansari Nagar, New Delhi 110029",
            latitude=28.5672, longitude=77.2100,
            operational_status="available", visibility="public",
            accessibility_features=["24x7 Emergency"],
            contact_public="Ambulance (Delhi CATS): 102",
            source_attribution="Ministry of Health & Family Welfare, Govt. of India",
            is_demo=False,
        ),
        HumanitarianResource(
            name="Delhi Jal Board, Water Emergency Helpline",
            category="water", sub_category="Drinking-water supply & tanker requests",
            disaster_id=delhi_air.id,
            address_approximate="Varunalaya Phase-II, Karol Bagh, New Delhi 110005",
            latitude=28.6480, longitude=77.1900,
            operational_status="available", visibility="public",
            accessibility_features=["24x7 phone helpline"],
            contact_public="Helpline: 1916",
            source_attribution="Delhi Jal Board, Govt. of NCT of Delhi",
            is_demo=False,
        ),
    )

    # ---------------------------------------------------- search & rescue teams
    db.add_all([
        SearchGroup(
            name="NDRF 4th Battalion, Arakkonam",
            organization_id=ndrf.id, disaster_id=ne_monsoon.id,
            capabilities=["Flood Water Rescue (boats)", "Collapsed Structure Search & Rescue", "Medical First Response"],
            service_region="Tamil Nadu, Puducherry & southern states",
            approximate_area="Battalion HQ: Arakkonam, Ranipet district, Tamil Nadu",
            latitude=13.0839, longitude=79.6706,
            public_contact="Emergency: 112 · ndrf.gov.in",
            operational_status="active", is_demo=False,
        ),
        SearchGroup(
            name="NDRF 3rd Battalion, Mundali, Cuttack",
            organization_id=ndrf.id, disaster_id=bob_cyclone.id,
            capabilities=["Cyclone Response", "Flood Water Rescue (boats)", "Tree & Debris Clearance"],
            service_region="Odisha & eastern coast",
            approximate_area="Battalion HQ: Mundali, Cuttack district, Odisha",
            latitude=20.4560, longitude=85.7310,
            public_contact="Emergency: 112 · ndrf.gov.in",
            operational_status="active", is_demo=False,
        ),
        SearchGroup(
            name="NDRF 8th Battalion, Ghaziabad",
            organization_id=ndrf.id, disaster_id=delhi_air.id,
            capabilities=["Collapsed Structure Search & Rescue", "CBRN Response", "Flood Water Rescue (boats)"],
            service_region="Delhi NCR & Uttar Pradesh",
            approximate_area="Battalion HQ: Ghaziabad, Uttar Pradesh",
            latitude=28.6692, longitude=77.4538,
            public_contact="Emergency: 112 · ndrf.gov.in",
            operational_status="active", is_demo=False,
        ),
        SearchGroup(
            name="Odisha Disaster Rapid Action Force (ODRAF)",
            organization_id=osdma.id, disaster_id=bob_cyclone.id,
            capabilities=["Cyclone Response", "Flood Water Rescue (boats)", "Road Clearance"],
            service_region="All districts of Odisha",
            approximate_area="Deployed by OSDMA, Bhubaneswar",
            latitude=20.2961, longitude=85.8245,
            public_contact="Emergency: 112",
            operational_status="active", is_demo=False,
        ),
    ])

    # ------------------------------------- sample tickets (no personal details)
    db.add_all([
        AssistanceRequest(
            disaster_id=ne_monsoon.id, user_id=citizen.id, user_name="Resident (Velachery)",
            assistance_category="water",
            description="Ground floor waterlogged after overnight rain; Metro Water supply contaminated. Need drinking water for a family of 4.",
            approximate_location="Velachery, Chennai", latitude=12.9815, longitude=80.2180,
            preferred_contact_method="app", status="in_progress",
            assigned_organization_id=gcc.id, assigned_helper_name="Zone 13 (Adyar) control room",
            notes="Forwarded to CMWSSB tanker cell.", is_demo=False,
        ),
        AssistanceRequest(
            disaster_id=ne_monsoon.id, user_id=citizen.id, user_name="Resident (Mudichur)",
            assistance_category="evacuation",
            description="Water entering houses on our street. Elderly person who cannot walk needs to be moved to a relief centre.",
            approximate_location="Mudichur, Tambaram, Chengalpattu district", latitude=12.9150, longitude=80.0720,
            preferred_contact_method="app", accessibility_needs="Elderly person, needs a wheelchair or stretcher",
            status="assigned", assigned_organization_id=ndrf.id, assigned_helper_name="NDRF 4th Bn boat team",
            is_demo=False,
        ),
        AssistanceRequest(
            disaster_id=ne_monsoon.id, user_id=citizen.id, user_name="Resident (Pallikaranai)",
            assistance_category="food",
            description="Power and shops closed for two days. Need dry rations / cooked food for 6 people including two children.",
            approximate_location="Pallikaranai, Chennai", latitude=12.9349, longitude=80.2137,
            preferred_contact_method="app", status="submitted", is_demo=False,
        ),
        AssistanceRequest(
            disaster_id=delhi_air.id, user_id=citizen.id, user_name="Resident (Anand Vihar)",
            assistance_category="medical",
            description="Asthma patient with breathlessness since AQI went 'Severe'. Need advice on nearest hospital and N95 masks.",
            approximate_location="Anand Vihar, East Delhi", latitude=28.6469, longitude=77.3164,
            preferred_contact_method="app", status="submitted", is_demo=False,
        ),
        AssistanceRequest(
            disaster_id=ne_monsoon.id, user_id=citizen.id, user_name="Resident (Perungudi)",
            assistance_category="shelter",
            description="House flooded; need a relief centre for the night.",
            approximate_location="Perungudi, Chennai", latitude=12.9653, longitude=80.2461,
            preferred_contact_method="app", status="fulfilled",
            assigned_organization_id=gcc.id, assigned_helper_name="Zone 14 (Perungudi) relief centre",
            notes="Accommodated at ward relief centre; meals provided.", is_demo=False,
        ),
    ])

    # --------------------------------------------------- SOPs (official guidance)
    db.add_all([
        SOPDocument(
            title="Cyclone: do's and don'ts",
            disaster_type="cyclone", lifecycle_stage="response", intended_audience="all",
            geographic_applicability="Coastal states & UTs of India",
            source_organization="National Disaster Management Authority (NDMA), Govt. of India",
            source_url="https://ndma.gov.in",
            summary="Before and during a cyclone: follow IMD warnings on radio/TV/SMS, keep an emergency kit ready, move to a "
                    "cyclone shelter or a strong building when told to evacuate, switch off mains and gas, and stay indoors until "
                    "authorities declare it safe.",
            instructions=[
                "Listen to IMD / All India Radio / Doordarshan bulletins and official SMS alerts; do not spread rumours.",
                "Keep an emergency kit: drinking water, dry food, medicines, torch, batteries, ID documents in a waterproof bag.",
                "Evacuate to the nearest cyclone shelter or safe building as soon as the administration advises.",
                "Switch off the electricity mains and close the gas cylinder; stay in the strongest part of the house away from windows.",
                "If the wind suddenly calms, do not go out. This may be the eye of the cyclone and winds will return from the opposite direction.",
            ],
            warnings=[
                "Fishermen must not venture into the sea after a cyclone warning.",
                "Keep away from fallen electric poles, loose wires and damaged buildings after the storm.",
            ],
            accessibility_notes="Register elderly, bedridden and persons with disabilities with the local panchayat / ward office for early assisted evacuation.",
            is_demo=False,
        ),
        SOPDocument(
            title="Floods: do's and don'ts",
            disaster_type="flood", lifecycle_stage="response", intended_audience="public",
            geographic_applicability="Flood-prone districts & urban areas",
            source_organization="National Disaster Management Authority (NDMA), Govt. of India",
            source_url="https://ndma.gov.in",
            summary="Move to higher ground early, avoid walking or driving through floodwater, drink only boiled or chlorinated "
                    "water, and keep away from electric lines and open drains.",
            instructions=[
                "Move to higher ground or upper floors with your emergency kit before water rises.",
                "Do not walk, swim or drive through flood water. Even shallow moving water can knock you down.",
                "Drink boiled or chlorinated water only; keep food covered.",
                "Switch off electricity and gas; do not touch electrical equipment if you are wet or standing in water.",
            ],
            warnings=[
                "Open manholes and drains are hidden under flood water.",
                "Beware of snakes and insects displaced by flood water.",
            ],
            accessibility_notes="Inform the ward / panchayat about bedridden or mobility-impaired family members before evacuation.",
            is_demo=False,
        ),
        SOPDocument(
            title="Earthquake: drop, cover and hold on",
            disaster_type="earthquake", lifecycle_stage="response", intended_audience="all",
            geographic_applicability="Seismic Zones II–V (all of India)",
            source_organization="National Disaster Management Authority (NDMA), Govt. of India",
            source_url="https://ndma.gov.in",
            summary="During shaking: Drop to the ground, take Cover under a sturdy table, and Hold On until shaking stops. "
                    "Stay away from glass and heavy furniture; after shaking, move to an open area away from buildings.",
            instructions=[
                "DROP to your hands and knees.",
                "COVER your head and neck under a sturdy table or against an inside wall.",
                "HOLD ON until the shaking stops.",
                "Once shaking stops, use the stairs (not lifts) and move to an open area away from buildings, trees and power lines.",
            ],
            warnings=[
                "Do not run outside while the ground is shaking.",
                "Expect aftershocks; do not re-enter damaged buildings.",
            ],
            is_demo=False,
        ),
        SOPDocument(
            title="Air pollution: protecting your health",
            disaster_type="other", lifecycle_stage="response", intended_audience="public",
            geographic_applicability="Delhi NCR & cities with 'Poor' or worse AQI",
            source_organization="Ministry of Health & Family Welfare, National Programme on Climate Change & Human Health",
            source_url="https://caqm.nic.in",
            summary="When AQI is 'Very Poor' or 'Severe', limit outdoor activity (especially for children, elderly and people with "
                    "heart or lung disease), use a well-fitted N95 mask outdoors, and seek medical care for breathlessness or chest pain.",
            instructions=[
                "Check the AQI (CPCB SAMEER app) before going out.",
                "Avoid outdoor exercise, morning walks and outdoor play for children on high-pollution days.",
                "Wear a well-fitted N95 / FFP2 mask outdoors; cloth or surgical masks give little protection.",
                "Keep prescribed inhalers and medicines handy; seek care immediately for breathlessness, chest pain or dizziness.",
            ],
            warnings=["Do not burn waste, leaves or wood. It is banned under GRAP and worsens local air quality."],
            is_demo=False,
        ),
        SOPDocument(
            title="Landslides: staying safe",
            disaster_type="landslide", lifecycle_stage="preparedness", intended_audience="all",
            geographic_applicability="Himalayan states, Western Ghats & North-East",
            source_organization="National Disaster Management Authority (NDMA), Govt. of India",
            source_url="https://ndma.gov.in",
            summary="In hilly areas during heavy rain, watch for warning signs: new cracks, tilting trees or poles, muddy water in "
                    "streams, rumbling sounds. Move away from the slide path to stable ground immediately.",
            instructions=[
                "Watch for new cracks in walls or ground, tilting trees/poles, and sudden muddy water in streams.",
                "During intense rain, stay alert; move away from steep slopes and stream channels.",
                "If you suspect a landslide, evacuate quickly to stable ground and inform the district control room (1077) or 112.",
            ],
            warnings=["Avoid travelling on hill roads during red-alert rainfall.", "Do not return to the slide area until declared safe."],
            is_demo=False,
        ),
        SOPDocument(
            title="Psychological First Aid: Look, Listen, Link",
            disaster_type="other", lifecycle_stage="recovery", intended_audience="helpers",
            geographic_applicability="Universal",
            source_organization="World Health Organization, Psychological First Aid: Guide for Field Workers (2011)",
            source_url="https://www.who.int/publications/i/item/9789241548205",
            summary="Psychological first aid is humane, supportive help for people in distress: LOOK for safety and urgent needs, "
                    "LISTEN without pressuring people to talk, and LINK them to practical help, information and loved ones.",
            instructions=[
                "LOOK: check for safety, people with obvious urgent basic needs, and people with serious distress reactions.",
                "LISTEN: approach people who may need support, ask about needs and concerns, listen and help them feel calm.",
                "LINK: help people meet basic needs and access services, cope with problems, and connect with loved ones and social support.",
            ],
            warnings=[
                "Do not pressure people to tell their story.",
                "Do not make promises you cannot keep or give false information.",
            ],
            is_demo=False,
        ),
    ])

    # --------------------------------------------------- preparedness checklist
    db.add(PreparednessChecklistModel(
        title="Household Emergency Kit (NDMA guidance)",
        category="cyclone",
        items=[
            {"id": "c1", "text": "Drinking water, at least 3 to 4 litres per person per day for 3 days", "completed": False, "priority": "critical"},
            {"id": "c2", "text": "Dry food that keeps: chivda, biscuits, roasted chana, jaggery, dates", "completed": False, "priority": "critical"},
            {"id": "c3", "text": "Prescription medicines (7 days), ORS packets and a first-aid kit", "completed": False, "priority": "critical"},
            {"id": "c4", "text": "Aadhaar, ration card, bank passbook and insurance papers in a waterproof pouch", "completed": False, "priority": "critical"},
            {"id": "c5", "text": "Torch, spare batteries and a charged power bank", "completed": False, "priority": "essential"},
            {"id": "c6", "text": "Battery / hand-crank radio to follow All India Radio & IMD bulletins", "completed": False, "priority": "essential"},
            {"id": "c7", "text": "Emergency numbers written on paper: 112, 108, 1078, 1070 / 1077", "completed": False, "priority": "essential"},
            {"id": "c8", "text": "Whistle to signal rescuers", "completed": False, "priority": "recommended"},
            {"id": "c9", "text": "Soap, sanitary pads, masks and chlorine tablets", "completed": False, "priority": "recommended"},
        ],
    ))

    db.commit()
    return {"status": "success", "message": "India reference data seeded"}
