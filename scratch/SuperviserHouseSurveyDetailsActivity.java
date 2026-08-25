package com.innovus.vyoma.NKDASurvey;

import static android.os.Build.VERSION.SDK_INT;
import static java.lang.Thread.sleep;
import static utilities.constants.Constant.authtokenKey;
import static utilities.constants.Urls.BASE_URL;
import static utilities.constants.Urls.BASE_URL_AUTH;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.text.Html;
import android.text.InputFilter;
import android.util.Base64;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.maps.model.LatLng;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import data_object.NKDASurveyModel;
import data_object.modelClass.GetHouseSurveyDetailsForText;
import data_object.modelClass.GetHouseSurveyInfoBean;
import data_object.modelClass.SaveHouseSurveySupervisorActionModelClass;
import data_object.modelClass.SaveHouseSurveySupervisorImgInfo;
import dmax.dialog.SpotsDialog;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import shared_pref.SharedStorage;
import utilities.constants.Constants;
import utilities.gps.GPSTracker;
import utilities.others.CToast;
import utilities.util.EnglishInputFilter;
import utilities.util.KeyboardUtil;
import utilities.util.ShowAlertDialog;

public class SuperviserHouseSurveyDetailsActivity extends AppCompatActivity implements View.OnClickListener {

    Spinner sp_getAction, sp_furtherActionRequired;
    private int house_survey_id;
    private SpotsDialog progressDialog;
    TextView tv_surveyID, tv_viewOnMap, tv_action_area_name, tv_block, tv_house_complex_id, tv_tower_no_id, tv_survey_date, tv_examined_cont_qty, tv_larvae_positive_cont_qty, tv_larvae_positive_cont_managed_qty, tv_is_house_positive_larvae, tv_fever_cases_found_qty,
            tv_location, tv_is_survey_possible, tv_survey_not_possible_reason, tv_remarks;
    Button bt_form_submit;
    ImageView iv_cancelImage2, iv_setimageImage2, iv_clickImage2, iv_cancelImage1, iv_setimageImage1, iv_clickImage1;
    private static final int PERMISSION_REQUEST_CODE = 200;
    private static final int REQUEST_IMAGE_CAPTURE = 1;
    private static final int REQUEST_PERMISSION_CODE = 101;
    private static final int RESULT_PICK_FROM_GALLERY = 103;
    private static final int RESULT_LOAD_IMAGE = 101;
    private boolean capture_image = false;
    BottomSheetDialog mBottomSheetDialog;
    private static String currenntPath = "";
    String picture1 = "", picture2 = "", text_is_FurtheractionTaken = "",
            text_is_actionTaken = "";
    ;
    NKDASurveyModel dataModel = NKDASurveyModel.getInstance();
    ArrayList<String> actionTakenList;
    ArrayList<String> furtherActionTaken;
    int selected_value_action_taken;
    int selected_value_further_action_taken;
    Bitmap bmpPic1;
    EditText et_comments;
    int user_ID;
    private GPSTracker gpsTracker;
    LatLng currentLocation = null;
    Double Destination_lat = 0.0;
    Double Destination_long = 0.0;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_superviser_house_survey_details);
        Toolbar toolbar = findViewById(R.id.toolbar);

        setSupportActionBar(toolbar);
        getSupportActionBar().setTitle(Html.fromHtml("<font color='#FFFFFF'>" + getResources().getString(R.string.pendingHouseSurveyDetails) + "</font>"));
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        Bundle bundle = getIntent().getExtras();
        house_survey_id = bundle.getInt("house_survey_id");

        initViews();

    }

    private void initViews() {
        tv_surveyID = findViewById(R.id.tv_surveyID);
        tv_viewOnMap = findViewById(R.id.tv_viewOnMap);
        tv_action_area_name = findViewById(R.id.tv_action_area_name);
        tv_block = findViewById(R.id.tv_block);
        tv_house_complex_id = findViewById(R.id.tv_house_complex_id);
        tv_tower_no_id = findViewById(R.id.tv_tower_no_id);
        tv_survey_date = findViewById(R.id.tv_survey_date);
        tv_examined_cont_qty = findViewById(R.id.tv_examined_cont_qty);
        tv_larvae_positive_cont_qty = findViewById(R.id.tv_larvae_positive_cont_qty);
        tv_larvae_positive_cont_managed_qty = findViewById(R.id.tv_larvae_positive_cont_managed_qty);
        tv_is_house_positive_larvae = findViewById(R.id.tv_is_house_positive_larvae);
        tv_fever_cases_found_qty = findViewById(R.id.tv_fever_cases_found_qty);
        tv_location = findViewById(R.id.tv_location);
        tv_is_survey_possible = findViewById(R.id.tv_is_survey_possible);
        tv_survey_not_possible_reason = findViewById(R.id.tv_survey_not_possible_reason);
        tv_remarks = findViewById(R.id.tv_remarks);

        sp_getAction = findViewById(R.id.sp_getAction);
        sp_furtherActionRequired = findViewById(R.id.sp_furtherActionRequired);
        bt_form_submit = findViewById(R.id.bt_form_submit);
        et_comments = findViewById(R.id.et_comments);

        iv_cancelImage1 = findViewById(R.id.iv_cancelImage1);
        iv_cancelImage2 = findViewById(R.id.iv_cancelImage2);

        iv_setimageImage2 = findViewById(R.id.iv_setimageImage2);
        iv_setimageImage1 = findViewById(R.id.iv_setimageImage1);

        iv_clickImage1 = findViewById(R.id.iv_clickImage1);
        iv_clickImage2 = findViewById(R.id.iv_clickImage2);
        KeyboardUtil.enforceEnglishKeyboard(et_comments, this);
        et_comments.setFilters(new InputFilter[]{new EnglishInputFilter(this)});

        if (haveNetworkConnection()) {
            getHouseSurveyInfo();
        } else {
            ShowAlertDialog.showAlertDialogFailure(SuperviserHouseSurveyDetailsActivity.this, getResources().getString(R.string.dataFetchingIssue));

        }


        bt_form_submit.setOnClickListener(this);
        iv_cancelImage1.setOnClickListener(this);
        iv_cancelImage2.setOnClickListener(this);
        iv_setimageImage2.setOnClickListener(this);
        iv_setimageImage1.setOnClickListener(this);
        iv_clickImage1.setOnClickListener(this);
        iv_clickImage2.setOnClickListener(this);
        checkLocationPermission();
        // fetch current location
        gpsTracker = new GPSTracker(this.getBaseContext());
        currentLocation = new LatLng(gpsTracker.getLatitude(), gpsTracker.getLongitude());
        Log.e("Current Location lat", String.valueOf(currentLocation.latitude));
        Log.e("Current Location long", String.valueOf(currentLocation.longitude));

        if (currentLocation.latitude == 0.0 && currentLocation.longitude == 0.0) {
            checkLocationPermission();
        }

        tv_viewOnMap.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(android.content.Intent.ACTION_VIEW,
                        Uri.parse("http://maps.google.com/maps?daddr=" + Destination_lat + "," + Destination_long));
                startActivity(intent);

            }
        });
        // initialize array list
        actionTakenList = new ArrayList<>();
        // set value in array list
        actionTakenList.add(getResources().getString(R.string.drop_down_no));
        actionTakenList.add(getResources().getString(R.string.drop_down_yes));

        furtherActionTaken = new ArrayList<>();
        furtherActionTaken.add(getResources().getString(R.string.drop_down_no));
        furtherActionTaken.add(getResources().getString(R.string.drop_down_yes));
        furtherActionTaken.add(getResources().getString(R.string.resolved));

        sp_furtherActionRequired.setSelection(0);
        sp_getAction.setSelection(0);

        actionTakenList.add(0, getResources().getString(R.string.choose_yes_no));
        furtherActionTaken.add(0, getResources().getString(R.string.choose_yes_no));


        ArrayAdapter actionTakenAdapter = new ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, actionTakenList);
        actionTakenAdapter.setDropDownViewResource(android.R.layout
                .simple_spinner_dropdown_item);
//Setting the ArrayAdapter data on the Spinner
        sp_getAction.setAdapter(actionTakenAdapter);


        ArrayAdapter furtherActionAdapter = new ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, furtherActionTaken);
        furtherActionAdapter.setDropDownViewResource(android.R.layout
                .simple_spinner_dropdown_item);
//Setting the ArrayAdapter data on the Spinner
        sp_furtherActionRequired.setAdapter(furtherActionAdapter);

        sp_furtherActionRequired.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
                // int selected_value = Integer.parseInt(furtherActionTaken.get(position));

                // FIX: Check if view is null to avoid crash
                if (adapterView.getChildAt(0) != null) {
                    ((TextView) adapterView.getChildAt(0)).setTextColor(Color.BLACK);
                }

                selected_value_further_action_taken = position;
                Log.e("FurtherID", String.valueOf(selected_value_further_action_taken));
                int selected_item = sp_furtherActionRequired.getSelectedItemPosition();
                if (selected_item != 0) {
                    if (selected_item == 2) {
                        text_is_FurtheractionTaken = "Yes";
                        selected_value_further_action_taken = selected_item - 1;
                        Log.e("selected_value", String.valueOf(selected_value_further_action_taken));

                    } else if (selected_item == 1) {
                        text_is_FurtheractionTaken = "No";
                        selected_value_further_action_taken = selected_item - 1;
                        Log.e("selected_value", String.valueOf(selected_value_further_action_taken));

                    } else {
                        text_is_FurtheractionTaken = "Resolved";
                        selected_value_further_action_taken = selected_item - 1;
                        Log.e("selected_value", String.valueOf(selected_value_further_action_taken));


                    }
                } else {
                    text_is_FurtheractionTaken = "";
                    selected_value_further_action_taken = selected_item;
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {

            }
        });


        sp_getAction.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
                // FIX: Check if view is null to avoid crash
                if (adapterView.getChildAt(0) != null) {
                    ((TextView) adapterView.getChildAt(0)).setTextColor(Color.BLACK);
                }

                selected_value_action_taken = position;
                Log.e("ActionTaken", String.valueOf(selected_value_action_taken));
                int selected_item = sp_getAction.getSelectedItemPosition();
                if (selected_item != 0) {
                    if (selected_item == 2) {
                        selected_value_action_taken = selected_item - 1;
                        text_is_actionTaken = "Yes";

                    } else if (selected_item == 1) {
                        selected_value_action_taken = selected_item - 1;
                        text_is_actionTaken = "No";

                    } else {
                        text_is_actionTaken = "";
                        selected_value_action_taken = selected_item;
                    }
                } else {
                    text_is_actionTaken = "";
                    selected_value_action_taken = selected_item;
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {

            }
        });

    }

    @Override
    public void onClick(View view) {
        if (view.getId() == R.id.bt_form_submit) {
            SaveHouseSurveySupervisorActionModelClass saveHouseSurveySupervisorActionModelClass = new SaveHouseSurveySupervisorActionModelClass();
            if (haveNetworkConnection()) {

                // FIX START: Safe User ID Parsing
                String userIdStr = SharedStorage.getValue(SuperviserHouseSurveyDetailsActivity.this, "user_id");
                if (userIdStr != null && !userIdStr.trim().isEmpty()) {
                    try {
                        user_ID = Integer.parseInt(userIdStr);
                    } catch (NumberFormatException e) {
                        e.printStackTrace();
                        ShowAlertDialog.showAlertDialog(SuperviserHouseSurveyDetailsActivity.this, "Invalid User ID. Please Login Again.");
                        return;
                    }
                } else {
                    ShowAlertDialog.showAlertDialog(SuperviserHouseSurveyDetailsActivity.this, "User ID not found. Please Login Again.");
                    return;
                }
                // FIX END: Safe User ID Parsing

                Log.e("userID", String.valueOf(user_ID));
                if (validate()) {
                    saveHouseSurveySupervisorActionModelClass.setSupervisor_user_id(user_ID);
                    saveHouseSurveySupervisorActionModelClass.setHouse_survey_id(house_survey_id);
                    saveHouseSurveySupervisorActionModelClass.setSupervisor_action(selected_value_action_taken);
                    saveHouseSurveySupervisorActionModelClass.setFurther_action_required(selected_value_further_action_taken);
                    saveHouseSurveySupervisorActionModelClass.setRemarks(et_comments.getText().toString());
                    saveHouseSurveySupervisorAction(saveHouseSurveySupervisorActionModelClass);
                }
            } else {
                ShowAlertDialog.showAlertDialogFailure(SuperviserHouseSurveyDetailsActivity.this, getResources().getString(R.string.dataFetchingIssue));

            }
        }
        if (view.getId() == R.id.iv_clickImage1) {
            dataModel.Chooseimage_from = "1";
            try {
                if (ContextCompat.checkSelfPermission(
                        this, Manifest.permission.CAMERA) ==
                        PackageManager.PERMISSION_GRANTED) {
                    // You can use the API that requires the permission.


                    selectImage();
                } else if (ActivityCompat.shouldShowRequestPermissionRationale(
                        this, Manifest.permission.CAMERA)) {
                    // In an educational UI, explain to the user why your app requires this
                    // permission for a specific feature to behave as expected, and what
                    // features are disabled if it's declined. In this UI, include a
                    // "cancel" or "no thanks" button that lets the user continue
                    // using your app without granting the permission.
                    requestPermissionLauncher.launch(
                            Manifest.permission.CAMERA);
                } else {
                    // You can directly ask for the permission.
                    // The registered ActivityResultCallback gets the result of this request.
                    requestPermissionLauncher.launch(
                            Manifest.permission.CAMERA);
                }

            } catch (Exception e) {
                ShowAlertDialog.showAlertDialogFailure(this, getResources().getString(R.string.dataFetchingIssue));

            }

        }
        if (view.getId() == R.id.iv_clickImage2) {
            dataModel.Chooseimage_from = "2";
            try {
                if (ContextCompat.checkSelfPermission(
                        this, Manifest.permission.CAMERA) ==
                        PackageManager.PERMISSION_GRANTED) {
                    // You can use the API that requires the permission.


                    selectImage();
                } else if (ActivityCompat.shouldShowRequestPermissionRationale(
                        this, Manifest.permission.CAMERA)) {
                    // In an educational UI, explain to the user why your app requires this
                    // permission for a specific feature to behave as expected, and what
                    // features are disabled if it's declined. In this UI, include a
                    // "cancel" or "no thanks" button that lets the user continue
                    // using your app without granting the permission.
                    requestPermissionLauncher.launch(
                            Manifest.permission.CAMERA);
                } else {
                    // You can directly ask for the permission.
                    // The registered ActivityResultCallback gets the result of this request.
                    requestPermissionLauncher.launch(
                            Manifest.permission.CAMERA);
                }

            } catch (Exception e) {
                ShowAlertDialog.showAlertDialogFailure(this, getResources().getString(R.string.dataFetchingIssue));

            }
        }


        if (view.getId() == R.id.iv_cancelImage1) {
            iv_setimageImage1.setImageDrawable(null);
            iv_clickImage1.setVisibility(View.VISIBLE);
            iv_cancelImage1.setVisibility(View.GONE);
        }
        if (view.getId() == R.id.iv_cancelImage2) {
            iv_setimageImage2.setImageDrawable(null);
            iv_clickImage2.setVisibility(View.VISIBLE);
            iv_cancelImage2.setVisibility(View.GONE);

        }

    }

    private boolean validate() {
        boolean result = true;
        if (text_is_actionTaken.equals("")) {
            ShowAlertDialog.showAlertDialog(this, getResources().getString(R.string.required_action_taken));
            result = false;
            return result;
        } else if (text_is_FurtheractionTaken.equals("")) {
            ShowAlertDialog.showAlertDialog(this, getResources().getString(R.string.required_further_actionRequired));
            result = false;
            return result;
        } else if (picture1.equals("") && (picture2.equals(""))) {
            ShowAlertDialog.showAlertDialog(this, getResources().getString(R.string.required_uploadoneImage));
            result = false;
            return result;
        }

        return result;
    }

    private void selectImage() {

        // BottomSheetDialog for uploading profile pictute
        mBottomSheetDialog = new BottomSheetDialog(this);
        View sheetView = this.getLayoutInflater().inflate(R.layout.fragment_photo_selection_dialog, null);

        TextView take_photo_txt = (TextView) sheetView.findViewById(R.id.take_photo_txt);
        TextView gallery_txt = (TextView) sheetView.findViewById(R.id.gallery_txt);


        gallery_txt.setOnClickListener(new View.OnClickListener() {
            @SuppressLint("NewApi")
            @Override
            public void onClick(View view) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && (ContextCompat.checkSelfPermission(
                            SuperviserHouseSurveyDetailsActivity.this, Manifest.permission.READ_MEDIA_IMAGES) ==
                            PackageManager.PERMISSION_GRANTED)) {
                        // You can use the API that requires the permission.


                        gallery();// image selected from gallery
                    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        // Use the requestPermessionLauncher to request the READ_MEDIA_IMAGES permission
                        requestPermissionLauncherforGalley.launch(Manifest.permission.READ_MEDIA_IMAGES);
                    } else if (ActivityCompat.shouldShowRequestPermissionRationale(
                            SuperviserHouseSurveyDetailsActivity.this, Manifest.permission.READ_MEDIA_IMAGES)) {

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            // Use the requestPermessionLauncher to request the READ_MEDIA_IMAGES permission
                            requestPermissionLauncherforGalley.launch(Manifest.permission.READ_MEDIA_IMAGES);
                        } else {
                            requestPermissionLauncherforGalley.launch(Manifest.permission.READ_EXTERNAL_STORAGE);
                        }

                    } else {
                        // You can directly ask for the permission.
                        // The registered ActivityResultCallback gets the result of this request.
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            // Use the requestPermessionLauncher to request the READ_MEDIA_IMAGES permission
                            requestPermissionLauncherforGalley.launch(Manifest.permission.READ_MEDIA_IMAGES);
                        } else {
                            requestPermissionLauncherforGalley.launch(Manifest.permission.READ_EXTERNAL_STORAGE);
                        }
                    }


                } catch (Exception e) {
                    ShowAlertDialog.showAlertDialogFailure(SuperviserHouseSurveyDetailsActivity.this, getResources().getString(R.string.dataFetchingIssue));

                }


            }
        });

        take_photo_txt.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                dispatchTakePictureIntent();
            }
        });

        mBottomSheetDialog.setContentView(sheetView);
        mBottomSheetDialog.show();
    }

    public void gallery() {

        mBottomSheetDialog.dismiss();

        if (SDK_INT >= Build.VERSION_CODES.R) {
            // Defining Implicit Intent to mobile gallery
            Intent intent = new Intent();
            intent.setType("image/*");
            intent.setAction(Intent.ACTION_GET_CONTENT);
            startActivityForResult(
                    Intent.createChooser(
                            intent,
                            "Select Image from here..."),
                    RESULT_PICK_FROM_GALLERY);

        } else {
            Intent in = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);

            if (in.resolveActivity(this.getPackageManager()) != null) {
                startActivityForResult(in, RESULT_LOAD_IMAGE);
            }
        }
    }

    // permission granted for camera and gallery
    private ActivityResultLauncher<String> requestPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                if (isGranted) {
                    selectImage();
                } else {
                    // Explain to the user that the feature is unavailable because the
                    // feature requires a permission that the user has denied. At the
                    // same time, respect the user's decision. Don't link to system
                    // settings in an effort to convince the user to change their
                    // decision.
                    Toast.makeText(this, "Permission Denied", Toast.LENGTH_SHORT).show();
                }
            });

    private ActivityResultLauncher<String> requestPermissionLauncherforGalley =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                if (isGranted) {
                    gallery();
                } else {
                    // Explain to the user that the feature is unavailable because the
                    // feature requires a permission that the user has denied. At the
                    // same time, respect the user's decision. Don't link to system
                    // settings in an effort to convince the user to change their
                    // decision.
                    Toast.makeText(this, "Permission Denied", Toast.LENGTH_SHORT).show();
                }
            });

    private void dispatchTakePictureIntent() {
        mBottomSheetDialog.dismiss();
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (takePictureIntent.resolveActivity(this.getPackageManager()) != null) {
            // Create the File where the photo should go
            File photoFile = null;
            try {

                photoFile = createImageFile();

            } catch (Exception e) {

            }
            try {

                // Continue only if the File was successfully created
                if (photoFile != null) {
                    Uri photoURI = FileProvider.getUriForFile(this, "com.innovus.vyoma.NKDASurvey.fileprovider", photoFile);
                    takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                    startActivityForResult(takePictureIntent, REQUEST_IMAGE_CAPTURE);
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void getHouseSurveyInfo() {
        GetHouseSurveyInfoBean getHouseSurveyInfoBean = new GetHouseSurveyInfoBean();
        getHouseSurveyInfoBean.setLogin_user_id(Integer.parseInt(SharedStorage.getValue(SuperviserHouseSurveyDetailsActivity.this, "user_id")));
        getHouseSurveyInfoBean.setHouse_survey_id(house_survey_id);
        getHouseSurveyInfoBean.setBoundary_id(Integer.parseInt(SharedStorage.getValue(SuperviserHouseSurveyDetailsActivity.this, "boundary_id")));
        getHouseSurveyInfoBean.setBoundary_level_id(Integer.parseInt(SharedStorage.getValue(SuperviserHouseSurveyDetailsActivity.this, "boundary_level_id")));
        getHouseSurveyInfoV1(getHouseSurveyInfoBean);
    }

    public void getHouseSurveyInfoV1(GetHouseSurveyInfoBean getHouseSurveyInfoBean) {
        Log.e("status", "Api Caled");
        try {
            start_progress_dialog();
            OkHttpClient client = new OkHttpClient()
                    .newBuilder()
                    .connectTimeout(200, TimeUnit.SECONDS)
                    .readTimeout(200, TimeUnit.SECONDS)
                    .build();
            //Gson gson = new Gson();
            Gson gson = new GsonBuilder().disableHtmlEscaping().create();
            // Convert the request data to JSON
            String jsonRequestBody = gson.toJson(getHouseSurveyInfoBean);
            Log.e("jsonRequestBody", jsonRequestBody);

            RequestBody requestBody = RequestBody.create(MediaType.parse("application/json"), jsonRequestBody);

            // Create the request
            MediaType mediaType = MediaType.parse("text/plain");
            RequestBody body = RequestBody.create(mediaType, "");
            Request request = new Request.Builder()
                    .url(BASE_URL + "getHHSurveyInfo")
                    .method("POST", body)
                    .header("Content-Type", "application/json")
                    .post(requestBody)
                    .addHeader("Authorization", "Bearer " + SharedStorage.getValue(SuperviserHouseSurveyDetailsActivity.this, "access_token"))
                    .build();

            Log.e("Base_url", BASE_URL + "getHHSurveyInfo");
            // Execute the request
            client.newCall(request).enqueue(new Callback() {


                public void onResponse(@NonNull okhttp3.Call call, @NonNull Response response) throws IOException {
                    if (response.isSuccessful()) {
                        stop_progress_dialog();
                        try {
                            String responseBody = response.body().string();
                            Log.e("response", responseBody);
                            JSONObject obj = new JSONObject(responseBody);

                            if (obj.getString("status").equals(Constants.STATUS_SUCCESS)) {

                                JSONArray getPendingHouseSurvey = obj.getJSONArray("data");
                                Log.e("Length", String.valueOf(getPendingHouseSurvey.length()));
                                if (getPendingHouseSurvey.length() > 0) {
                                    for (int j = 0; j < getPendingHouseSurvey.length(); j++) {
                                        JSONObject pendingHouseSurveyDetail = getPendingHouseSurvey.getJSONObject(j);
                                        GetHouseSurveyDetailsForText getHouseSurveyDetailsForText = new GetHouseSurveyDetailsForText();
                                        getHouseSurveyDetailsForText.setHouse_survey_id(pendingHouseSurveyDetail.getString("house_survey_id"));
                                        getHouseSurveyDetailsForText.setAction_area_id(pendingHouseSurveyDetail.getString("action_area_id"));
                                        getHouseSurveyDetailsForText.setAction_area_name(pendingHouseSurveyDetail.getString("action_area_name"));
                                        getHouseSurveyDetailsForText.setBlock_id(pendingHouseSurveyDetail.getString("block_id"));
                                        getHouseSurveyDetailsForText.setBlock_name(pendingHouseSurveyDetail.getString("block_name"));
                                        getHouseSurveyDetailsForText.setPlot_id(pendingHouseSurveyDetail.getString("plot_id"));
                                        getHouseSurveyDetailsForText.setFlat_no_id(pendingHouseSurveyDetail.getString("flat_no_id"));
                                        getHouseSurveyDetailsForText.setHouse_complex_id(pendingHouseSurveyDetail.getString("house_complex_id"));
                                        getHouseSurveyDetailsForText.setTower_no_id(pendingHouseSurveyDetail.getString("tower_no_id"));
                                        getHouseSurveyDetailsForText.setSurvey_date(pendingHouseSurveyDetail.getString("survey_date"));
                                        getHouseSurveyDetailsForText.setExamined_cont_qty(pendingHouseSurveyDetail.getString("examined_cont_qty"));
                                        getHouseSurveyDetailsForText.setLarvae_positive_cont_qty(pendingHouseSurveyDetail.getString("larvae_positive_cont_qty"));
                                        getHouseSurveyDetailsForText.setLarvae_positive_cont_managed_qty(pendingHouseSurveyDetail.getString("larvae_positive_cont_managed_qty"));
                                        getHouseSurveyDetailsForText.setIs_house_positive_larvae(pendingHouseSurveyDetail.getString("is_house_positive_larvae"));
                                        getHouseSurveyDetailsForText.setFever_cases_found_qty(pendingHouseSurveyDetail.getString("fever_cases_found_qty"));
                                        getHouseSurveyDetailsForText.setLocation(pendingHouseSurveyDetail.getString("latitude") + "," + pendingHouseSurveyDetail.getString("longitude"));
                                        getHouseSurveyDetailsForText.setIs_survey_possible_id(pendingHouseSurveyDetail.getString("is_survey_possible_id"));
                                        getHouseSurveyDetailsForText.setIs_survey_possible(pendingHouseSurveyDetail.getString("is_survey_possible"));
                                        getHouseSurveyDetailsForText.setSurvey_not_possible_reason(pendingHouseSurveyDetail.getString("survey_not_possible_reason"));
                                        getHouseSurveyDetailsForText.setLocation(pendingHouseSurveyDetail.getString("latitude") + "," + pendingHouseSurveyDetail.getString("longitude"));
                                        getHouseSurveyDetailsForText.setRemarks(pendingHouseSurveyDetail.getString("remarks"));
                                        Destination_lat = Double.valueOf(pendingHouseSurveyDetail.getString("latitude"));
                                        Destination_long = Double.valueOf(pendingHouseSurveyDetail.getString("longitude"));
                                        setDataToTextView(getHouseSurveyDetailsForText);
                                    }
                                }
                            } else if (obj.getString("status").equals(Constants.STATUS_ONE)) {
                                stop_progress_dialog();
                                backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, obj.getString("message"));
                            } else if (obj.getString("status").equals(Constants.THREE)) {
                                stop_progress_dialog();
                                backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, obj.getString("message"));
                            } else if (obj.getString("status").equals(Constants.FOUR)) {
                                stop_progress_dialog();
                                backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, obj.getString("message"));
                            }


                        } catch (Exception e) {
                            stop_progress_dialog();
                            Log.e("Exception", e.toString());
                        }

                    } else {
                        stop_progress_dialog();
                        genarateAuthToken();
                        try {
                            Thread.sleep(300);
                            getHouseSurveyInfoV1(getHouseSurveyInfoBean);
                        } catch (InterruptedException e) {
                            throw new RuntimeException(e);
                        }

                        // Handle an unsuccessful response here
                    }
                }

                @Override
                public void onFailure(@NonNull okhttp3.Call call, @NonNull IOException e) {
                    //  stop_progress_dialog();
                    Log.e("Faliure", e.toString());
                    backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, getResources().getString(R.string.brokenLink));

                }
            });
        } catch (Exception e) {
            // Exception handling code
            // This block will execute if an exception is thrown
            Log.e("ResData", "An error occurred: " + e.getMessage());
        }
    }

    private void setDataToTextView(GetHouseSurveyDetailsForText getHouseSurveyDetailsForText) {

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                String survey_id = String.valueOf(getHouseSurveyDetailsForText.getHouse_survey_id());
                tv_surveyID.setText(survey_id);
                tv_action_area_name.setText(getHouseSurveyDetailsForText.getAction_area_name());
                tv_block.setText(getHouseSurveyDetailsForText.getBlock_name());
                tv_house_complex_id.setText(getHouseSurveyDetailsForText.getHouse_complex_id());
                tv_tower_no_id.setText(getHouseSurveyDetailsForText.getTower_no_id());
                tv_survey_date.setText(getHouseSurveyDetailsForText.getSurvey_date());
                tv_examined_cont_qty.setText(String.valueOf(getHouseSurveyDetailsForText.getExamined_cont_qty()));
                tv_larvae_positive_cont_qty.setText(getHouseSurveyDetailsForText.getLarvae_positive_cont_qty());
                tv_larvae_positive_cont_managed_qty.setText(getHouseSurveyDetailsForText.getLarvae_positive_cont_managed_qty());
                if (getHouseSurveyDetailsForText.getIs_house_positive_larvae().equals("1")) {
                    tv_is_house_positive_larvae.setText("NO");

                } else {
                    tv_is_house_positive_larvae.setText("YES");

                }
                // tv_is_house_positive_larvae.setText(getHouseSurveyDetailsForText.getIs_house_positive_larvae());
                //  tv_FatherName.setText(pendingHouseSurveyDetail.getString("FatherName"));
                tv_fever_cases_found_qty.setText(getHouseSurveyDetailsForText.getFever_cases_found_qty());
                tv_location.setText(String.valueOf(getHouseSurveyDetailsForText.getLocation()));

                if (getHouseSurveyDetailsForText.getIs_survey_possible().equals("1")) {
                    tv_is_survey_possible.setText("NO");

                } else {
                    tv_is_survey_possible.setText("YES");
                }
                tv_survey_not_possible_reason.setText(String.valueOf(getHouseSurveyDetailsForText.getSurvey_not_possible_reason()));
                tv_remarks.setText(getHouseSurveyDetailsForText.getRemarks());
            }
        });
    }

    public void saveHouseSurveySupervisorAction(SaveHouseSurveySupervisorActionModelClass saveHouseSurveySupervisorActionModelClass) {
        try {
            start_progress_dialog();
            OkHttpClient client = new OkHttpClient()
                    .newBuilder()
                    .connectTimeout(200, TimeUnit.SECONDS)
                    .readTimeout(200, TimeUnit.SECONDS)
                    .build();
            //Gson gson = new Gson();
            Gson gson = new GsonBuilder().disableHtmlEscaping().create();
            // Convert the request data to JSON
            String jsonRequestBody = gson.toJson(saveHouseSurveySupervisorActionModelClass);
            // Convert the request data to JSON
            //String jsonRequestBody = gson.toJson(houseSurveyDetailsModelClass);
            RequestBody requestBody = RequestBody.create(MediaType.parse("application/json"), jsonRequestBody);
            Log.e("request body api", jsonRequestBody.toString());
            // Create the request
            MediaType mediaType = MediaType.parse("text/plain");
            RequestBody body = RequestBody.create(mediaType, "");
            Request request = new Request.Builder()
                    .url(BASE_URL + "saveHouseSurveySupervisorAction")
                    .method("POST", body)
                    .header("Content-Type", "application/json")
                    .post(requestBody)
                    .addHeader("Authorization", "Bearer " + SharedStorage.getValue(SuperviserHouseSurveyDetailsActivity.this, "access_token"))
                    .build();


            // Execute the request
            client.newCall(request).enqueue(new Callback() {


                public void onResponse(@NonNull okhttp3.Call call, @NonNull Response response) throws IOException {
                    if (response.isSuccessful()) {
                        stop_progress_dialog();
                        try {
                            String responseBody = response.body().string();
                            Log.e("response", responseBody);
                            JSONObject obj = new JSONObject(responseBody);

                            if (obj.getString("status").equals(Constants.STATUS_SUCCESS)) {

                                // FIX: Handle Image Upload First
                                if (!picture1.equals("") || !picture2.equals("")) {
                                    SaveHouseSurveySupervisorImgInfo saveHouseSurveyDocInfo = new SaveHouseSurveySupervisorImgInfo();
                                    ArrayList<String> imageList = new ArrayList<String>();
                                    if (!picture1.equals("")) {
                                        imageList.add(picture1);
                                    }
                                    if (!picture2.equals("")) {
                                        imageList.add(picture2);
                                    }

                                    for (int i = 0; i < imageList.size(); i++) {
                                        if (!imageList.get(i).equals("")) {
                                            // Safe parsing again for image upload
                                            String uidStr = SharedStorage.getValue(SuperviserHouseSurveyDetailsActivity.this, "user_id");
                                            int uid = (uidStr != null && !uidStr.isEmpty()) ? Integer.parseInt(uidStr) : 0;

                                            saveHouseSurveyDocInfo.setEntry_user_id(uid);
                                            saveHouseSurveyDocInfo.setHouse_survey_id(house_survey_id);
                                            // Original logic was i+9 if no images, but here we are inside image loop so use appropriate type
                                            // Adjust this ID logic if needed based on your backend
                                            saveHouseSurveyDocInfo.setHouse_survey_img_type_id(i + 1);
                                            saveHouseSurveyDocInfo.setHouse_survey_img(imageList.get(i));

                                            saveHouseSurveyDocInfo(saveHouseSurveyDocInfo);
                                            try {
                                                sleep(500);
                                            } catch (InterruptedException e) {
                                                e.printStackTrace();
                                            }
                                        }
                                    }
                                }

                                // FIX: Success Message and Delay on Main Thread
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        Toast.makeText(SuperviserHouseSurveyDetailsActivity.this, "Data Saved Successfully", Toast.LENGTH_SHORT).show();

                                        // 1.5 Second delay before navigating
                                        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                                            @Override
                                            public void run() {
                                                resetAllField();
                                            }
                                        }, 1500);
                                    }
                                });

                            } else if (obj.getString("status").equals(Constants.STATUS_ONE)) {
                                stop_progress_dialog();
                                backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, obj.getString("message"));
                            } else if (obj.getString("status").equals(Constants.THREE)) {
                                stop_progress_dialog();
                                backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, obj.getString("message"));
                            }


                        } catch (Exception e) {
                            Log.e("Exception", e.toString());
                        }

                    } else {
                        stop_progress_dialog();
                        genarateAuthToken();
                        try {
                            sleep(300);
                            saveHouseSurveySupervisorAction(saveHouseSurveySupervisorActionModelClass);
                        } catch (InterruptedException e) {
                            throw new RuntimeException(e);
                        }

                        // Handle an unsuccessful response here
                    }
                }

                @Override
                public void onFailure(@NonNull okhttp3.Call call, @NonNull IOException e) {
                    stop_progress_dialog();
                    Log.e("Faliure", e.toString());
                    backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, getResources().getString(R.string.onFaliure_api_response_text));

                }
            });
        } catch (Exception e) {
            // Exception handling code
            // This block will execute if an exception is thrown
            Log.e("ResData", "An error occurred: " + e.getMessage());
        }
    }

    public void saveHouseSurveyDocInfo(SaveHouseSurveySupervisorImgInfo saveHouseSurveyDocInfo) {
        try {
            // start_progress_dialog();
            OkHttpClient client = new OkHttpClient()
                    .newBuilder()
                    .connectTimeout(200, TimeUnit.SECONDS)
                    .readTimeout(200, TimeUnit.SECONDS)
                    .build();

            //Gson gson = new Gson();
            Gson gson = new GsonBuilder().disableHtmlEscaping().create();
            // Convert the request data to JSON
            String jsonRequestBody = gson.toJson(saveHouseSurveyDocInfo);
            // Convert the request data to JSON
            //String jsonRequestBody = gson.toJson(houseSurveyDetailsModelClass);
            RequestBody requestBody = RequestBody.create(MediaType.parse("application/json"), jsonRequestBody);
            Log.e("request body api", jsonRequestBody.toString());
            // Create the request
            MediaType mediaType = MediaType.parse("text/plain");
            RequestBody body = RequestBody.create(mediaType, "");
            Request request = new Request.Builder()
                    // .url(BASE_URL+"saveHouseSurveyDocInfo")
                    .url(BASE_URL + "saveHouseSurveySupervisorImgInfo")
                    .method("POST", body)
                    .header("Content-Type", "application/json")
                    .post(requestBody)
                    .addHeader("Authorization", "Bearer " + SharedStorage.getValue(SuperviserHouseSurveyDetailsActivity.this, "access_token"))
                    .build();


            // Execute the request
            client.newCall(request).enqueue(new Callback() {


                public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                    if (response.isSuccessful()) {
                        //stop_progress_dialog();
                        try {
                            String responseBody = response.body().string();
                            Log.e("response", responseBody);
                            JSONObject obj = new JSONObject(responseBody);

                            if (obj.getString("status").equals(Constants.STATUS_SUCCESS)) {
                                Log.e("Success", "Image Successfully Uploaded");
                                // We are handling navigation in the main save function now
                                // backgroundThreadShortToastImage(SuperviserHouseSurveyDetailsActivity.this,obj.getString("message"));
                            } else if (obj.getString("status").equals(Constants.STATUS_ONE)) {
                                backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, obj.getString("message"));
                            } else if (obj.getString("status").equals(Constants.THREE)) {
                                backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, obj.getString("message"));
                            }


                        } catch (Exception e) {
                            Log.e("Exception", e.toString());
                        }

                    } else {
                        stop_progress_dialog();
                        genarateAuthToken();
                        try {
                            sleep(300);
                            saveHouseSurveyDocInfo(saveHouseSurveyDocInfo);
                        } catch (InterruptedException e) {
                            throw new RuntimeException(e);
                        }

                        // Handle an unsuccessful response here
                    }
                }

                @Override
                public void onFailure(@NonNull okhttp3.Call call, @NonNull IOException e) {
                    stop_progress_dialog();
                    Log.e("Faliure", e.toString());
                    backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, getResources().getString(R.string.brokenLink));

                }
            });
        } catch (Exception e) {
            // Exception handling code
            // This block will execute if an exception is thrown
            Log.e("ResData", "An error occurred: " + e.getMessage());
        }

    }

    public void backgroundThreadShortToastImage(final Context context,
                                                final String msg) {
        if (context != null && msg != null) {
            new Handler(Looper.getMainLooper()).post(new Runnable() {

                @Override
                public void run() {
//                    tv_uploadImage.setVisibility(View.GONE);
//                    llayout_first_image.setVisibility(View.GONE);
//                    llayout_second_image.setVisibility(View.GONE);

                    iv_setimageImage1.setImageDrawable(null);
                    iv_setimageImage2.setImageDrawable(null);

                    iv_cancelImage1.setVisibility(View.GONE);
                    iv_cancelImage2.setVisibility(View.GONE);

                    iv_clickImage1.setVisibility(View.VISIBLE);
                    iv_clickImage2.setVisibility(View.VISIBLE);

                    dataModel.picturePath = "";
                    dataModel.Chooseimage_from = "";
                    // ShowAlertDialog.showAlertDialog(SuperviserHouseSurveyDetailsActivity.this,msg);
                    try {
                        Thread.sleep(300);
                        resetAllField();
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }

                    //Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

// SuperviserHouseSurveyDetailsActivity.java ke andar

    private void resetAllField() {
        dataModel.houseSurveyTakenID = house_survey_id;

        // "startActivity" hata diya hai. Sirf finish() rakhein.
        // Jaise hi ye band hoga, pichla page (List wala) apne aap dikhega.
        finish();

        overridePendingTransition(R.anim.trans_right_in, R.anim.trans_right_out);
    }

    private void genarateAuthToken() {
        try {
            OkHttpClient client = new OkHttpClient().newBuilder()
                    .connectTimeout(50, TimeUnit.SECONDS)
                    .readTimeout(50, TimeUnit.SECONDS)
                    .build();
            MediaType mediaType = MediaType.parse("text/plain");
            RequestBody body = RequestBody.create(mediaType, "");
            Request request = new Request.Builder()
                    .url(BASE_URL_AUTH + "generateToken")
                    .method("POST", body)
                    .addHeader("Authorization", "Basic " + authtokenKey)
                    .build();
            Response response = client.newCall(request).execute();
            if (response.isSuccessful()) {
                // Get the response body as a string
                String responseBody = response.body().string();
                JSONObject obj = new JSONObject(responseBody);
                if (obj.getString("status").equals(Constants.STATUS_SUCCESS)) {
                    JSONObject dataObject1 = obj.getJSONObject("data");
                    Log.e("key", dataObject1.getString("access_token"));
                    SharedStorage.setValue(SuperviserHouseSurveyDetailsActivity.this, "access_token", dataObject1.getString("access_token"));
                } else if (obj.getString("status").equals(Constants.STATUS_ONE)) {
                    backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, " Error");
                }

                //System.out.println("Response Body: " + responseBody);
            } else {
                stop_progress_dialog();
                backgroundThreadShortToast(SuperviserHouseSurveyDetailsActivity.this, getResources().getString(R.string.onFaliure_api_response_text));
                System.out.println("Error: Unexpected response code: " + response.code());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    void start_progress_dialog() {

        try {
            progressDialog = new SpotsDialog(SuperviserHouseSurveyDetailsActivity.this, R.style.CustomWaitDialog);
            progressDialog.setCancelable(false);
            progressDialog.show();

        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    void stop_progress_dialog() {

        if (progressDialog != null) {
            try {
                progressDialog.dismiss();
                progressDialog = null;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

    }

    public void backgroundThreadShortToast(final Context context,
                                           final String msg) {
        if (context != null && msg != null) {
            new Handler(Looper.getMainLooper()).post(new Runnable() {

                @Override
                public void run() {

                    ShowAlertDialog.showAlertDialog(SuperviserHouseSurveyDetailsActivity.this, msg);
                }
            });
        }
    }


    private boolean haveNetworkConnection() {
        boolean haveConnectedWifi = false;
        boolean haveConnectedMobile = false;

        ConnectivityManager cm = (ConnectivityManager) this.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo[] netInfo = cm.getAllNetworkInfo();
        for (NetworkInfo ni : netInfo) {
            if (ni.getTypeName().equalsIgnoreCase("WIFI"))
                if (ni.isConnected())
                    haveConnectedWifi = true;
            if (ni.getTypeName().equalsIgnoreCase("MOBILE"))
                if (ni.isConnected())
                    haveConnectedMobile = true;
        }
        return haveConnectedWifi || haveConnectedMobile;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            onBackPressed();
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();

        startActivity(new Intent(SuperviserHouseSurveyDetailsActivity.this, PendingHouseActivityNk.class));
        overridePendingTransition(R.anim.trans_right_in, R.anim.trans_right_out);
        finish();

    }

    private File createImageFile() throws IOException {
        // Create an image file name
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.ENGLISH).format(new Date());
        String imageFileName = "JPEG_temp" + timeStamp;

        File storageDir = this.getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(
                imageFileName,  /* prefix */
                ".jpg",         /* suffix */
                storageDir      /* directory */
        );


        if (!image.getAbsolutePath().equals("")) {
            currenntPath = image.getAbsolutePath();

        }

        // Save a file: path for use with ACTION_VIEW intents
        return image;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Permission Granted", Toast.LENGTH_SHORT).show();

                // main logic
            } else {
                Toast.makeText(this, "Permission Denied", Toast.LENGTH_SHORT).show();

            }
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == RESULT_OK) {
//            Bundle extras = data.getExtras();
//            if (extras != null) {
//                // Get the captured image
//                Uri imageUri = data.getData();
//                iv_setimage1.setImageURI(imageUri);
//            }
            try {
                Log.e("current_image", currenntPath);
                if (!currenntPath.equals("")) {
                    // capture_image = true;

                    Matrix mat = new Matrix();
                    int compressionRatio = 30;

                    ExifInterface exif = new ExifInterface(currenntPath);
                    String orientstring = exif.getAttribute(ExifInterface.TAG_ORIENTATION);
                    int orientation = orientstring != null ? Integer.parseInt(orientstring) : ExifInterface.ORIENTATION_ROTATE_90;
                    int rotateangle = 0;
                    if (orientation == ExifInterface.ORIENTATION_ROTATE_90)
                        rotateangle = 90;
                    if (orientation == ExifInterface.ORIENTATION_ROTATE_180)
                        rotateangle = 180;
                    if (orientation == ExifInterface.ORIENTATION_ROTATE_270)
                        rotateangle = 270;

                    Bitmap myBitmap = BitmapFactory.decodeFile(currenntPath);
                    mat.setRotate(rotateangle, (float) myBitmap.getWidth() / 2, (float) myBitmap.getHeight() / 2);
                    bmpPic1 = Bitmap.createBitmap(myBitmap, 0, 0, myBitmap.getWidth(), myBitmap.getHeight(), mat, true);
                    File mSourceFile_imagecapture = new File(currenntPath);

                    bmpPic1.compress(Bitmap.CompressFormat.JPEG, compressionRatio, new FileOutputStream(mSourceFile_imagecapture));

                    dataModel.picturePath = currenntPath;

                    if (dataModel.Chooseimage_from.equals("1")) {
                        iv_setimageImage1.setImageBitmap(bmpPic1);
                        iv_clickImage1.setVisibility(View.GONE);
                        iv_cancelImage1.setVisibility(View.VISIBLE);

                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        Bitmap bitmap = BitmapFactory.decodeFile(dataModel.picturePath);
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, baos);
                        byte[] imageBytes = baos.toByteArray();
                        picture1 = Base64.encodeToString(imageBytes, Base64.NO_WRAP);
                        //imageUpload(picture1);

                    }
                    if (dataModel.Chooseimage_from.equals("2")) {
                        iv_setimageImage2.setImageBitmap(bmpPic1);
                        iv_cancelImage2.setVisibility(View.VISIBLE);
                        iv_clickImage2.setVisibility(View.GONE);

                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        Bitmap bitmap = BitmapFactory.decodeFile(dataModel.picturePath);
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, baos);
                        byte[] imageBytes = baos.toByteArray();
                        picture2 = Base64.encodeToString(imageBytes, Base64.NO_WRAP);

                        // imageUpload(picture2);

                    }


                }

            } catch (Exception e) {
                e.printStackTrace();
            }
        } else if (requestCode == RESULT_LOAD_IMAGE && resultCode == RESULT_OK && null != data) {
            try {
                capture_image = false;

                Uri selectedImage = data.getData();
                Log.e("selectedImage", String.valueOf(selectedImage));
                String[] filePathColumn = {MediaStore.Images.Media.DATA};
                Cursor cursor = this.getContentResolver().query(selectedImage, filePathColumn, null, null, null);
                cursor.moveToFirst();
                int columnIndex = cursor.getColumnIndex(filePathColumn[0]);
                String picturePath = cursor.getString(columnIndex);
                Log.e("picturePath", picturePath);

                Matrix mat = new Matrix();
                int compressionRatio = 30;
                ExifInterface exif = new ExifInterface(picturePath);
                String orientstring = exif.getAttribute(ExifInterface.TAG_ORIENTATION);
                int orientation = orientstring != null ? Integer.parseInt(orientstring) : ExifInterface.ORIENTATION_NORMAL;
                int rotateangle = 0;
                if (orientation == ExifInterface.ORIENTATION_ROTATE_90)
                    rotateangle = 90;
                if (orientation == ExifInterface.ORIENTATION_ROTATE_180)
                    rotateangle = 180;
                if (orientation == ExifInterface.ORIENTATION_ROTATE_270)
                    rotateangle = 270;

                Bitmap myBitmap = BitmapFactory.decodeFile(picturePath);
                mat.setRotate(rotateangle, (float) myBitmap.getWidth() / 2, (float) myBitmap.getHeight() / 2);
                bmpPic1 = Bitmap.createBitmap(myBitmap, 0, 0, myBitmap.getWidth(), myBitmap.getHeight(), mat, true);
                cursor.close();

                dataModel.picturePath = picturePath;
                if (dataModel.Chooseimage_from.equals("1")) {
                    iv_setimageImage1.setImageBitmap(bmpPic1);
                    iv_clickImage1.setVisibility(View.GONE);
                    iv_cancelImage1.setVisibility(View.VISIBLE);

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    Bitmap bitmap = BitmapFactory.decodeFile(dataModel.picturePath);
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, baos);
                    byte[] imageBytes = baos.toByteArray();
                    picture1 = Base64.encodeToString(imageBytes, Base64.NO_WRAP);
                    //imageUpload(picture1);

                }
                if (dataModel.Chooseimage_from.equals("2")) {
                    iv_setimageImage2.setImageBitmap(bmpPic1);
                    iv_cancelImage2.setVisibility(View.VISIBLE);
                    iv_clickImage2.setVisibility(View.GONE);

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    Bitmap bitmap = BitmapFactory.decodeFile(dataModel.picturePath);
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, baos);
                    byte[] imageBytes = baos.toByteArray();
                    picture2 = Base64.encodeToString(imageBytes, Base64.NO_WRAP);

                    // imageUpload(picture2);

                }


            } catch (Exception ex) {
                String strMessage = ex.getMessage();
                Log.e("strMessage", strMessage);
            }
        } else if (requestCode == RESULT_PICK_FROM_GALLERY && resultCode == RESULT_OK && null != data) {
            try {
                capture_image = false;

                Uri selectedImage = data.getData();
                Log.e("selectedImage", String.valueOf(selectedImage));
                String[] filePathColumn = {MediaStore.Images.Media.DATA};
                Cursor cursor = this.getContentResolver().query(selectedImage, filePathColumn, null, null, null);
                cursor.moveToFirst();
                int columnIndex = cursor.getColumnIndex(filePathColumn[0]);
                String picturePath = cursor.getString(columnIndex);
                Log.e("picturePath", picturePath);

                Matrix mat = new Matrix();
                int compressionRatio = 30;
                ExifInterface exif = new ExifInterface(picturePath);
                String orientstring = exif.getAttribute(ExifInterface.TAG_ORIENTATION);
                int orientation = orientstring != null ? Integer.parseInt(orientstring) : ExifInterface.ORIENTATION_NORMAL;
                int rotateangle = 0;
                if (orientation == ExifInterface.ORIENTATION_ROTATE_90)
                    rotateangle = 90;
                if (orientation == ExifInterface.ORIENTATION_ROTATE_180)
                    rotateangle = 180;
                if (orientation == ExifInterface.ORIENTATION_ROTATE_270)
                    rotateangle = 270;

                Bitmap myBitmap = BitmapFactory.decodeFile(picturePath);
                mat.setRotate(rotateangle, (float) myBitmap.getWidth() / 2, (float) myBitmap.getHeight() / 2);
                bmpPic1 = Bitmap.createBitmap(myBitmap, 0, 0, myBitmap.getWidth(), myBitmap.getHeight(), mat, true);
                cursor.close();

                dataModel.picturePath = picturePath;
                if (dataModel.Chooseimage_from.equals("1")) {
                    iv_setimageImage1.setImageBitmap(bmpPic1);
                    iv_clickImage1.setVisibility(View.GONE);
                    iv_cancelImage1.setVisibility(View.VISIBLE);

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    Bitmap bitmap = BitmapFactory.decodeFile(dataModel.picturePath);
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, baos);
                    byte[] imageBytes = baos.toByteArray();
                    picture1 = Base64.encodeToString(imageBytes, Base64.NO_WRAP);
                    //imageUpload(picture1);

                }
                if (dataModel.Chooseimage_from.equals("2")) {
                    iv_setimageImage2.setImageBitmap(bmpPic1);
                    iv_cancelImage2.setVisibility(View.VISIBLE);
                    iv_clickImage2.setVisibility(View.GONE);

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    Bitmap bitmap = BitmapFactory.decodeFile(dataModel.picturePath);
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, baos);
                    byte[] imageBytes = baos.toByteArray();
                    picture2 = Base64.encodeToString(imageBytes, Base64.NO_WRAP);

                    // imageUpload(picture2);

                }


            } catch (Exception ex) {
                String strMessage = ex.getMessage();
                Log.e("strMessage", strMessage);
            }
//            try {
//                capture_image = false;
//
//                uriArrayList = intent.getParcelableArrayListExtra(FilePickerConst.KEY_SELECTED_MEDIA);
//                Uri selectedImage = uriArrayList.get(0);
//                Log.e("selectedImage", String.valueOf(selectedImage));
//
//
//                try {
//
//                    // Setting image on image view using Bitmap
//                    Bitmap myBitmap = MediaStore
//                            .Images
//                            .Media
//                            .getBitmap(
//                                    getActivity().getContentResolver(),
//                                    selectedImage);
//
//                    Matrix mat = new Matrix();
//                    int rotateangle = 0;
//                    int compressionRatio = 30;
//                    InputStream inputStream = getActivity().getContentResolver().openInputStream(selectedImage);
//                    File filenew = createImageFile();
//                    FileOutputStream outputStream = new FileOutputStream(filenew, false);
//                    int read;
//                    byte[] bytes = new byte[8192];
//                    while ((read = inputStream.read(bytes)) != -1) {
//                        outputStream.write(bytes, 0, read);
//                    }
//                    mat.setRotate(rotateangle, (float) myBitmap.getWidth() / 2, (float) myBitmap.getHeight() / 2);
//                    bmpPic1 = Bitmap.createBitmap(myBitmap, 0, 0, myBitmap.getWidth(), myBitmap.getHeight(), mat, true);
//                    img_profile_circle.setImageBitmap(bmpPic1);
//                    String picturePath = getImageUri(getActivity(),bmpPic1);
//                    String [] picture = picturePath.split(":/");
//                    setUserImageUpload(SharedStorage.getValue(getActivity(),"UserId"),currenntPath);
//
//                    if (!picture[1].equals("")) {
//                        dataModel.picturePath=currenntPath;
//                    }
//                }
//
//                catch (IOException e) {
//                    // Log the exception
//                    e.printStackTrace();
//                }
//
//            } catch (Exception ex) {
//                String strMessage = ex.getMessage();
//                Log.e("strMessage", strMessage);
//            }
        }

    }

    private void checkLocationPermission() {

        try {
            if (ContextCompat.checkSelfPermission(
                    this, Manifest.permission.ACCESS_FINE_LOCATION) ==
                    PackageManager.PERMISSION_GRANTED) {
                // You can use the API that requires the permission.
                if (ContextCompat.checkSelfPermission(
                        this, Manifest.permission.ACCESS_COARSE_LOCATION) ==
                        PackageManager.PERMISSION_GRANTED) {
                    fetchLocation();
                }

            } else if (ActivityCompat.shouldShowRequestPermissionRationale(
                    this, Manifest.permission.ACCESS_FINE_LOCATION)) {

                if (ActivityCompat.shouldShowRequestPermissionRationale(
                        this, Manifest.permission.ACCESS_COARSE_LOCATION)) {
                    requestPermissionLauncherForLocation.launch(
                            Manifest.permission.ACCESS_FINE_LOCATION);
                    requestPermissionLauncherForLocation.launch(
                            Manifest.permission.ACCESS_COARSE_LOCATION);
                }


            } else {
                // You can directly ask for the permission.
                // The registered ActivityResultCallback gets the result of this request.
                requestPermissionLauncherForLocation.launch(Manifest.permission.ACCESS_FINE_LOCATION);
                requestPermissionLauncherForLocation.launch(Manifest.permission.ACCESS_COARSE_LOCATION);
            }

        } catch (Exception e) {
            ShowAlertDialog.showAlertDialogFailure(this, getResources().getString(R.string.dataFetchingIssue));

        }

    }

    private void fetchLocation() {
        gpsTracker = new GPSTracker(this.getBaseContext());
        currentLocation = new LatLng(gpsTracker.getLatitude(), gpsTracker.getLongitude());
        Log.e("Current Location", currentLocation.latitude + "," + currentLocation.latitude);

    }

    private ActivityResultLauncher<String> requestPermissionLauncherForLocation =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                if (isGranted) {
                    fetchLocation();
                } else {
                    // Explain to the user that the feature is unavailable because the
                    // feature requires a permission that the user has denied. At the
                    // same time, respect the user's decision. Don't link to system
                    // settings in an effort to convince the user to change their
                    // decision.
                    // checkLocationPermission();
                    Toast.makeText(this, "Permission Denied", Toast.LENGTH_SHORT).show();
                }
            });

}