from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
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
    PreparednessChecklistModel
)

router = APIRouter(prefix="/seed", tags=["Seed & Demo Data"])

@router.post("/demo")
def seed_demo_data(force: bool = False, db: Session = Depends(get_db)):
    """
    Seeds comprehensive, clearly marked DEMO data into the database.
    """
    # Create tables if not created
    Base.metadata.create_all(bind=engine)

    existing_disasters = db.query(DisasterEvent).count()
    if existing_disasters > 0 and not force:
        return {"message": "Demo data already seeded", "count": existing_disasters}

    if force:
        db.query(ResourceInventory).delete()
        db.query(HumanitarianResource).delete()
        db.query(SearchGroup).delete()
        db.query(AssistanceRequest).delete()
        db.query(SOPDocument).delete()
        db.query(PreparednessChecklistModel).delete()
        db.query(DisasterEvent).delete()
        db.query(Organization).delete()
        db.query(HelperProfile).delete()
        db.query(User).delete()
        db.commit()

    # 1. Users
    user_needer = User(
        email="needer@kindminds.demo",
        display_name="Devika Sharma (Citizen)",
        active_panel="needer",
        is_verified_helper=False
    )
    user_helper = User(
        email="helper@kindminds.demo",
        display_name="Dr. Rajesh Varma (Relief Coordinator)",
        active_panel="helper",
        is_verified_helper=True,
        helper_type="medical"
    )
    db.add_all([user_needer, user_helper])
    db.commit()
    db.refresh(user_needer)
    db.refresh(user_helper)

    helper_profile = HelperProfile(
        user_id=user_helper.id,
        helper_type="medical",
        verification_status="verified",
        service_categories=["medical", "mental_health", "essential_supplies"],
        geographic_coverage=["Western Coast", "Gujarat", "Maharashtra"],
        public_contact="+91-98765-43210"
    )
    db.add(helper_profile)

    # 2. Organizations (Clearly DEMO labeled)
    org1 = Organization(
        name="[DEMO] Apex Disaster Health Coalition",
        organization_type="Medical Response NGO",
        description="Rapid trauma care, emergency triage, mobile clinics, and psychological first aid in affected zones.",
        assistance_categories=["medical", "mental_health"],
        geographic_coverage=["Western Coast", "Northern Plains"],
        public_contact="coordinator@apex-health-demo.org",
        website="https://kindminds.demo/org/apex",
        verification_status="verified",
        operational_status="active",
        is_demo=True
    )
    org2 = Organization(
        name="[DEMO] Hope & Shelter International",
        organization_type="Humanitarian Shelter Network",
        description="Community safe spaces, emergency shelter kits, accessible temporary housing, and family reunification.",
        assistance_categories=["shelter", "family_reunification", "disability"],
        geographic_coverage=["All Coastal & Flood-prone Districts"],
        public_contact="shelter-desk@hope-demo.org",
        website="https://kindminds.demo/org/hopeshelter",
        verification_status="verified",
        operational_status="active",
        is_demo=True
    )
    org3 = Organization(
        name="[DEMO] CleanFlow Water & Relief Mission",
        organization_type="WASH (Water, Sanitation & Hygiene)",
        description="High-capacity mobile water purification units, hygiene kits, and bulk clean drinking water distribution.",
        assistance_categories=["water", "food", "essential_supplies"],
        geographic_coverage=["National"],
        public_contact="ops@cleanflow-demo.org",
        website="https://kindminds.demo/org/cleanflow",
        verification_status="verified",
        operational_status="active",
        is_demo=True
    )
    org4 = Organization(
        name="[DEMO] Rapid Coastal SAR Taskforce",
        organization_type="Search & Rescue Alliance",
        description="Water rescue, evacuation rafts, high-water vehicle extraction, and remote community reconnaissance.",
        assistance_categories=["evacuation", "transportation", "missing_person"],
        geographic_coverage=["Coastal Regions"],
        public_contact="sar-control@coastaltask-demo.org",
        website="https://kindminds.demo/org/coastalsar",
        verification_status="verified",
        operational_status="active",
        is_demo=True
    )
    db.add_all([org1, org2, org3, org4])
    db.commit()
    db.refresh(org1)
    db.refresh(org2)
    db.refresh(org3)
    db.refresh(org4)

    # 3. Disasters
    d1 = DisasterEvent(
        name="[DEMO] Coastal Cyclone & Storm Surge 'Sagar'",
        category="cyclone",
        description="Category 3 cyclonic storm landfall leading to severe coastal inundation, high wind damage, and localized grid disruption.",
        region="Western Coastal Belt (Saurashtra - Konkan)",
        severity="critical",
        status="active",
        lifecycle_stage="response",
        source="IMD & NDMA Public Advisory Bulletin (Simulated)",
        latitude=21.6417,
        longitude=69.6293,
        affected_population=185000,
        is_demo=True
    )
    d2 = DisasterEvent(
        name="[DEMO] Northern River Basin Flash Floods",
        category="flood",
        description="Monsoonal cloudburst followed by river embankment breach affecting low-lying agrarian communities and urban outskirts.",
        region="Yamuna Basin & Foothills",
        severity="severe",
        status="active",
        lifecycle_stage="response",
        source="State Disaster Management Authority (Simulated)",
        latitude=28.7041,
        longitude=77.1025,
        affected_population=74000,
        is_demo=True
    )
    d3 = DisasterEvent(
        name="[DEMO] Eastern Foothills Landslide & Road Severance",
        category="landslide",
        description="Heavy precipitation-induced slope failure blocking arterial relief highways; air and foot rescue staging underway.",
        region="Darjeeling - Sikkim Corridor",
        severity="moderate",
        status="monitoring",
        lifecycle_stage="mitigation",
        source="Geological Survey of India (Simulated)",
        latitude=27.0410,
        longitude=88.2663,
        affected_population=21000,
        is_demo=True
    )
    db.add_all([d1, d2, d3])
    db.commit()
    db.refresh(d1)
    db.refresh(d2)
    db.refresh(d3)

    # 4. Humanitarian Resources & Warehouses
    r1 = HumanitarianResource(
        name="[DEMO] Coastal Trauma Staging Center #1",
        category="medical",
        sub_category="Field Hospital & Triage",
        disaster_id=d1.id,
        organization_id=org1.id,
        address_approximate="Near Port Highway Sector 4, Porbandar",
        latitude=21.6420,
        longitude=69.6290,
        operational_status="available",
        visibility="public",
        accessibility_features=["Wheelchair Ramp", "Sign Language Interpreter On-site", "Power Generator Backed"],
        contact_public="+91-91234-56789",
        source_attribution="District Medical Liaison Office",
        is_demo=True
    )
    r2 = HumanitarianResource(
        name="[DEMO] High Ground Community Safe Haven",
        category="shelter",
        sub_category="Evacuation Shelter",
        disaster_id=d1.id,
        organization_id=org2.id,
        address_approximate="Government Polytechnic Grounds, Veraval",
        latitude=20.9000,
        longitude=70.3667,
        operational_status="available",
        visibility="public",
        accessibility_features=["Accessible Restrooms", "Elderly Separate Dorms", "Mother & Child Feeding Booth"],
        contact_public="+91-92345-67890",
        source_attribution="Hope & Shelter International Ground Team",
        is_demo=True
    )
    r3 = HumanitarianResource(
        name="[DEMO] Regional WASH Relief Depot & Water Station",
        category="water",
        sub_category="Purification & Distribution Hub",
        disaster_id=d1.id,
        organization_id=org3.id,
        address_approximate="Industrial Estate Ring Road, Junagadh",
        latitude=21.5222,
        longitude=70.4579,
        operational_status="available",
        visibility="public",
        accessibility_features=["Low-height tap stations", "Container Assistance Volunteers"],
        contact_public="+91-93456-78901",
        source_attribution="CleanFlow Field Report",
        is_demo=True
    )
    r4 = HumanitarianResource(
        name="[DEMO] Central Humanitarian Supply Warehouse Beta",
        category="warehouse",
        sub_category="Bunker & Stockpile Depot",
        disaster_id=d1.id,
        organization_id=org3.id,
        address_approximate="Secured Logistics Park, Rajkot Environs",
        latitude=22.3039,
        longitude=70.8022,
        operational_status="available",
        visibility="verified_helpers",
        accessibility_features=["Heavy Vehicle Loading Bays", "Cold Storage Zone"],
        contact_public="logistics-desk@kindminds.demo",
        source_attribution="Inter-Agency Standing Committee Logistics",
        is_demo=True
    )
    r5 = HumanitarianResource(
        name="[DEMO] Riverbank Mobile Medical Clinic",
        category="medical",
        sub_category="Mobile Health Van",
        disaster_id=d2.id,
        organization_id=org1.id,
        address_approximate="Yamuna Floodplain Relief Camp Sector 12",
        latitude=28.6800,
        longitude=77.2300,
        operational_status="available",
        visibility="public",
        accessibility_features=["Mobile Ramp", "Emergency Medications Stocked"],
        contact_public="+91-94567-89012",
        source_attribution="State Red Cross Volunteer Network",
        is_demo=True
    )
    r6 = HumanitarianResource(
        name="[DEMO] Community Kitchen & Food Hub #3",
        category="food",
        sub_category="Hot Meal & Ration Kit Center",
        disaster_id=d2.id,
        organization_id=org3.id,
        address_approximate="Community Hall, Shahdara",
        latitude=28.6700,
        longitude=77.2900,
        operational_status="available",
        visibility="public",
        accessibility_features=["Priority Line for Elderly & Persons with Disabilities"],
        contact_public="+91-95678-90123",
        source_attribution="WASH & Food Coordination Cluster",
        is_demo=True
    )
    db.add_all([r1, r2, r3, r4, r5, r6])
    db.commit()
    db.refresh(r1)
    db.refresh(r2)
    db.refresh(r3)
    db.refresh(r4)

    # 5. Inventories
    inv1 = ResourceInventory(resource_id=r1.id, item_name="Trauma & First Aid Kits", quantity=450, unit="kits", inventory_status="available")
    inv2 = ResourceInventory(resource_id=r1.id, item_name="IV Saline & Rehydration Salts", quantity=1200, unit="units", inventory_status="available")
    inv3 = ResourceInventory(resource_id=r2.id, item_name="Emergency Blankets & Cots", quantity=800, unit="sets", inventory_status="available")
    inv4 = ResourceInventory(resource_id=r2.id, item_name="Family Hygiene & Dignity Kits", quantity=620, unit="kits", inventory_status="available")
    inv5 = ResourceInventory(resource_id=r3.id, item_name="Water Purification Tablets (100-pack)", quantity=3500, unit="packs", inventory_status="available")
    inv6 = ResourceInventory(resource_id=r3.id, item_name="20-Litre Clean Water Jerry Cans", quantity=1400, unit="cans", inventory_status="available")
    inv7 = ResourceInventory(resource_id=r4.id, item_name="High-Capacity Water Pumps (5HP)", quantity=24, unit="units", inventory_status="reserved")
    inv8 = ResourceInventory(resource_id=r4.id, item_name="Emergency Inflatable Dinghies", quantity=12, unit="boats", inventory_status="available")
    db.add_all([inv1, inv2, inv3, inv4, inv5, inv6, inv7, inv8])

    # 6. Search and Rescue Groups
    sg1 = SearchGroup(
        name="[DEMO] Coastal Swift Water Rescue Team Alpha",
        organization_id=org4.id,
        disaster_id=d1.id,
        capabilities=["Motorized Flood Boats", "Night Reconnaissance", "Elderly Extraction"],
        service_region="Porbandar - Dwarka Coastal Strip",
        approximate_area="Within 35km radius of port basin",
        latitude=21.6500,
        longitude=69.6100,
        public_contact="+91-97890-12345",
        operational_status="active",
        is_demo=True
    )
    sg2 = SearchGroup(
        name="[DEMO] Foothills Landslide Recon Squad",
        organization_id=org4.id,
        disaster_id=d3.id,
        capabilities=["Slope Stabilization Support", "Drone Thermal Search", "First Aid Evac"],
        service_region="Darjeeling Arterial Bypass",
        approximate_area="Sikkim Highway KM 42-68",
        latitude=27.0500,
        longitude=88.2700,
        public_contact="+91-98901-23456",
        operational_status="active",
        is_demo=True
    )
    db.add_all([sg1, sg2])

    # 7. Assistance Requests
    req1 = AssistanceRequest(
        disaster_id=d1.id,
        user_id=user_needer.id,
        user_name="Devika Sharma",
        assistance_category="food",
        description="Elderly family of 4 stranded due to road submergence. Need clean drinking water and baby formula.",
        approximate_location="Near Old Lighthouse Colony, Veraval",
        latitude=20.8950,
        longitude=70.3600,
        preferred_contact_method="phone",
        contact_value="+91-98111-22334",
        accessibility_needs="Grandmother uses wheelchair, ground-floor delivery needed",
        status="in_progress",
        assigned_organization_id=org3.id,
        assigned_helper_name="CleanFlow Team Lead Raman",
        notes="Dispatched 2 food kits and 40L water at 09:30 AM",
        is_demo=True
    )
    req2 = AssistanceRequest(
        disaster_id=d1.id,
        user_id=user_needer.id,
        user_name="Karan Patel",
        assistance_category="medical",
        description="Diabetic senior requiring insulin storage and wound dressing check after evacuation.",
        approximate_location="Sector 7 School Compound, Porbandar",
        latitude=21.6350,
        longitude=69.6250,
        preferred_contact_method="sms",
        contact_value="+91-98222-33445",
        accessibility_needs="Hearing impairment; please communicate via SMS or written note",
        status="assigned",
        assigned_organization_id=org1.id,
        assigned_helper_name="Nurse Anita K.",
        notes="Mobile triage team scheduled for afternoon visit",
        is_demo=True
    )
    req3 = AssistanceRequest(
        disaster_id=d1.id,
        user_id=user_needer.id,
        user_name="Sunita Ben",
        assistance_category="shelter",
        description="Roof damaged by heavy cyclone gusts. Looking for nearest safe shelter with pet accommodations.",
        approximate_location="Bhadrakali Temple Area, Junagadh outskirts",
        latitude=21.5200,
        longitude=70.4500,
        preferred_contact_method="phone",
        contact_value="+91-98333-44556",
        status="submitted",
        is_demo=True
    )
    req4 = AssistanceRequest(
        disaster_id=d2.id,
        user_id=user_needer.id,
        user_name="Mohammad Irfan",
        assistance_category="evacuation",
        description="Water level reaching 4 feet on ground floor. 3 children and 1 elderly person need boat ferry to dry ground.",
        approximate_location="Yamuna Khadar Cluster 5",
        latitude=28.6750,
        longitude=77.2350,
        preferred_contact_method="phone",
        contact_value="+91-98444-55667",
        status="submitted",
        is_demo=True
    )
    req5 = AssistanceRequest(
        disaster_id=d1.id,
        user_id=user_needer.id,
        user_name="Ramesh Joshi",
        assistance_category="water",
        description="Submersible well flooded with turbid seawater. Immediate clean water needed for community kitchen.",
        approximate_location="Fishermen Colony, Porbandar",
        latitude=21.6450,
        longitude=69.6300,
        preferred_contact_method="in_person",
        status="fulfilled",
        assigned_organization_id=org3.id,
        assigned_helper_name="CleanFlow Team 2",
        notes="Delivered 500 water purification tablets and 1000L bowser refill. Verified on-site.",
        is_demo=True
    )
    db.add_all([req1, req2, req3, req4, req5])

    # 8. SOP Documents across all lifecycle stages
    sop1 = SOPDocument(
        title="[DEMO] Cyclonic Wind & Surge Immediate Action Protocol",
        disaster_type="cyclone",
        lifecycle_stage="response",
        intended_audience="all",
        geographic_applicability="Coastal Zones",
        source_organization="National Disaster Management Authority (NDMA)",
        source_url="https://ndma.gov.in/guidelines/cyclone",
        summary="Critical immediate precautions during cyclone landfall: stay indoors in the strongest interior room away from glass windows, turn off electrical mains and gas valves, keep battery torches ready, and monitor official emergency broadcasts.",
        instructions=[
            "Switch off all power mains and gas cylinders immediately upon red alert.",
            "Move to the innermost room of the house with no exterior glass windows or structural cracks.",
            "Keep emergency grab-bag ready with drinking water, essential prescription medicines, and ID copies.",
            "Do not venture outside during the 'eye' of the cyclone when wind temporarily stops; winds will reverse violently."
        ],
        warnings=[
            "Never touch fallen power lines or step into stagnant floodwater near transformers.",
            "Avoid driving through submerged roads or causeways."
        ],
        accessibility_notes="Ensure battery backup for mobility devices or prioritize early assisted transfer to designated accessible shelters.",
        is_demo=True
    )
    sop2 = SOPDocument(
        title="[DEMO] Urban & Floodplain Evacuation & Water Safety",
        disaster_type="flood",
        lifecycle_stage="response",
        intended_audience="public",
        geographic_applicability="Riverine & Urban Flood Basins",
        source_organization="Central Water Commission & Red Cross",
        source_url="https://cwc.gov.in/flood-advisories",
        summary="Step-by-step guidance on safe vertical evacuation, avoiding waterborne contamination, and signaling rescue teams without putting oneself in rapid water currents.",
        instructions=[
            "Move to upper floors or community high-ground staging before access routes submerge.",
            "Boil drinking water vigorously for at least 3 minutes or use certified halogen tablets.",
            "Signal rescue boats from rooftop using a bright cloth or whistle; do not wade into fast-flowing water deeper than knee level."
        ],
        warnings=[
            "6 inches of fast water can knock down an adult; 12 inches can sweep away small cars.",
            "Open drains and manholes are invisible underwater."
        ],
        accessibility_notes="Inform neighborhood ward coordinators in advance of bedridden or mobility-impaired residents.",
        is_demo=True
    )
    sop3 = SOPDocument(
        title="[DEMO] Pre-Monsoon Flood Mitigation & Community Drainage",
        disaster_type="flood",
        lifecycle_stage="mitigation",
        intended_audience="helpers",
        geographic_applicability="Municipalities & Rural Panchayats",
        source_organization="Disaster Resilience Alliance",
        source_url="https://kindminds.demo/sop/flood-mitigation",
        summary="Action checklist for local ward coordinators and volunteer groups to inspect sluice gates, clear stormwater culverts, and pre-position sandbags.",
        instructions=[
            "Inspect and desilt stormwater channels at all arterial road crossings.",
            "Pre-position 500 sandbags at identified embankment weak points.",
            "Establish two-way radio check schedules with district disaster emergency operations center."
        ],
        warnings=["Do not perform culvert clearance during active thunderstorm surges."],
        is_demo=True
    )
    sop4 = SOPDocument(
        title="[DEMO] Post-Disaster Psychosocial First Aid & Grounding",
        disaster_type="other",
        lifecycle_stage="recovery",
        intended_audience="all",
        geographic_applicability="Universal",
        source_organization="World Health Organization (WHO) & NIMHANS",
        source_url="https://who.int/mental_health/emergencies",
        summary="Evidence-based psychological first aid principles: Look, Listen, and Link. Offer safe space, emotional stabilization, and practical support without forcing trauma recollection.",
        instructions=[
            "LOOK: Check for physical safety and people with urgent basic needs.",
            "LISTEN: Approach people calmly, listen without pressing them to talk, and validate their feelings.",
            "LINK: Connect people with verified food/water/medical resources, loved ones, and community support."
        ],
        warnings=[
            "Never pressure survivors to recount traumatic events or force emotional disclosure.",
            "Never make promises of resources or outcomes you cannot personally guarantee."
        ],
        is_demo=True
    )
    db.add_all([sop1, sop2, sop3, sop4])

    # 9. Preparedness Checklists
    chk1 = PreparednessChecklistModel(
        title="Household Emergency 72-Hour Survival Kit",
        category="cyclone",
        items=[
            {"id": "c1", "text": "Drinking water (at least 3 liters per person per day for 3 days)", "completed": False, "priority": "critical"},
            {"id": "c2", "text": "Non-perishable food (ready-to-eat dry rations, canned goods, biscuits)", "completed": False, "priority": "critical"},
            {"id": "c3", "text": "Essential prescription medications & first aid supplies (min. 7-day supply)", "completed": False, "priority": "critical"},
            {"id": "c4", "text": "Battery-powered or hand-crank radio with spare batteries", "completed": False, "priority": "essential"},
            {"id": "c5", "text": "High-lumen LED flashlight and heavy-duty power bank", "completed": False, "priority": "essential"},
            {"id": "c6", "text": "Waterproof pouch for Aadhaar/ID cards, insurance, and medical records", "completed": False, "priority": "critical"},
            {"id": "c7", "text": "Emergency whistle to signal location to search teams", "completed": False, "priority": "recommended"},
            {"id": "c8", "text": "Sanitation & personal hygiene supplies, wet wipes, and masks", "completed": False, "priority": "recommended"}
        ]
    )
    db.add(chk1)

    db.commit()
    return {"status": "success", "message": "Comprehensive DEMO data seeded successfully"}

