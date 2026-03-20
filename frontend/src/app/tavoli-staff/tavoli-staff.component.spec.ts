import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TavoliStaffComponent } from './tavoli-staff.component';

describe('TavoliStaffComponent', () => {
  let component: TavoliStaffComponent;
  let fixture: ComponentFixture<TavoliStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TavoliStaffComponent],
      imports: [HttpClientTestingModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TavoliStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
