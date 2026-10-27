--
-- PostgreSQL database dump
--

\restrict VgUTckWxoQrFfe9BJ1DF7Oq4PXJAj05XgNe5xqgPBMcIzNkfhGJ9BwDuzGMgk2r

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: birthdaywish_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.birthdaywish_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public.birthdaywish_status OWNER TO postgres;

--
-- Name: chitiettailieu_hienthi; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.chitiettailieu_hienthi AS ENUM (
    'TAT_CA',
    'NOI_BO_PHONG_BAN'
);


ALTER TYPE public.chitiettailieu_hienthi OWNER TO postgres;

--
-- Name: document_kind; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.document_kind AS ENUM (
    'vanbanden',
    'vanbandi'
);


ALTER TYPE public.document_kind OWNER TO postgres;

--
-- Name: emaillog_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.emaillog_status AS ENUM (
    'PENDING',
    'SENDING',
    'SUCCESS',
    'FAILED',
    'RETRY'
);


ALTER TYPE public.emaillog_status OWNER TO postgres;

--
-- Name: employee_work_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employee_work_status AS ENUM (
    'LAM_VIEC',
    'NGHI_VIEC'
);


ALTER TYPE public.employee_work_status OWNER TO postgres;

--
-- Name: hieu_luc_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.hieu_luc_status AS ENUM (
    'CON_HIEU_LUC',
    'CON_HIEU_LUC_1_PHAN',
    'HET_HIEU_LUC',
    'HET_VA_THAY_THE'
);


ALTER TYPE public.hieu_luc_status OWNER TO postgres;

--
-- Name: meetingbooking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.meetingbooking_status AS ENUM (
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public.meetingbooking_status OWNER TO postgres;

--
-- Name: meetingroom_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.meetingroom_status AS ENUM (
    'AVAILABLE',
    'MAINTENANCE',
    'UNAVAILABLE'
);


ALTER TYPE public.meetingroom_status OWNER TO postgres;

--
-- Name: signing_attempt_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.signing_attempt_status AS ENUM (
    'DRAFT',
    'CHO_KY',
    'YEU_CAU_SUA',
    'HOAN_THANH',
    'TU_CHOI',
    'HUY',
    'QUA_HAN'
);


ALTER TYPE public.signing_attempt_status OWNER TO postgres;

--
-- Name: signing_manifest_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.signing_manifest_status AS ENUM (
    'DRAFT',
    'FINAL'
);


ALTER TYPE public.signing_manifest_status OWNER TO postgres;

--
-- Name: signing_notify_channel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.signing_notify_channel AS ENUM (
    'IN_APP',
    'EMAIL'
);


ALTER TYPE public.signing_notify_channel OWNER TO postgres;

--
-- Name: signing_notify_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.signing_notify_status AS ENUM (
    'CHO_GUI',
    'DA_GUI',
    'THAT_BAI'
);


ALTER TYPE public.signing_notify_status OWNER TO postgres;

--
-- Name: signing_process_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.signing_process_status AS ENUM (
    'DRAFT',
    'HOAT_DONG',
    'NGUNG'
);


ALTER TYPE public.signing_process_status OWNER TO postgres;

--
-- Name: signing_request_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.signing_request_status AS ENUM (
    'NHAP',
    'CHO_KY',
    'HOAN_THANH',
    'TU_CHOI',
    'HUY',
    'QUA_HAN'
);


ALTER TYPE public.signing_request_status OWNER TO postgres;

--
-- Name: signing_scope; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.signing_scope AS ENUM (
    'DEPARTMENT',
    'COMPANY'
);


ALTER TYPE public.signing_scope OWNER TO postgres;

--
-- Name: signing_step_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.signing_step_status AS ENUM (
    'CHO_KY',
    'DA_KY',
    'TU_CHOI',
    'BO_QUA',
    'YEU_CAU_SUA',
    'THU_HOI'
);


ALTER TYPE public.signing_step_status OWNER TO postgres;

--
-- Name: signing_thread_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.signing_thread_status AS ENUM (
    'OPEN',
    'RELEASED',
    'RESOLVED'
);


ALTER TYPE public.signing_thread_status OWNER TO postgres;

--
-- Name: signing_verify_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.signing_verify_status AS ENUM (
    'CHUA_XAC_MINH',
    'HOP_LE',
    'KHONG_HOP_LE'
);


ALTER TYPE public.signing_verify_status OWNER TO postgres;

--
-- Name: task_attachment_loai; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_attachment_loai AS ENUM (
    'GIAO_VIEC',
    'BANG_CHUNG'
);


ALTER TYPE public.task_attachment_loai OWNER TO postgres;

--
-- Name: task_vaitro; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_vaitro AS ENUM (
    'CHU_TRI',
    'CHI_DAO',
    'THAM_GIA'
);


ALTER TYPE public.task_vaitro OWNER TO postgres;

--
-- Name: auto_stt_uu_tien_hoso(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_stt_uu_tien_hoso() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN
IF NEW.stt_uu_tien IS NULL OR NEW.stt_uu_tien = 0 THEN
-- Advisory lock trên OID của bảng để serialize việc tính MAX
PERFORM pg_advisory_xact_lock('records_hoso'::regclass::oid::bigint);
NEW.stt_uu_tien := COALESCE(
(SELECT MAX(stt_uu_tien) FROM records_hoso), 0
) + 1;
END IF;
RETURN NEW;
END;

$$;


ALTER FUNCTION public.auto_stt_uu_tien_hoso() OWNER TO postgres;

--
-- Name: check_vanbanden_cross_reference(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_vanbanden_cross_reference() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE
v_hoso_id BIGINT;
BEGIN
SELECT ho_so_id INTO v_hoso_id FROM records_loaivanban WHERE id = NEW.loaivanban_id;
IF EXISTS (SELECT 1 FROM documents_vanbanden_hoso WHERE vanbanden_id = NEW.vanbanden_id) THEN
IF NOT EXISTS (
SELECT 1 FROM documents_vanbanden_hoso
WHERE vanbanden_id = NEW.vanbanden_id AND hoso_id = v_hoso_id
) THEN
RAISE EXCEPTION 'Vi phạm toàn vẹn tham chiếu chéo: Loại văn bản (id=%) thuộc Hồ sơ (id=%), nhưng Văn bản đến (id=%) không liên kết với Hồ sơ này.',
NEW.loaivanban_id, v_hoso_id, NEW.vanbanden_id;
END IF;
END IF;
RETURN NEW;
END;

$$;


ALTER FUNCTION public.check_vanbanden_cross_reference() OWNER TO postgres;

--
-- Name: check_vanbanden_hoso_delete_cross_ref(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_vanbanden_hoso_delete_cross_ref() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN
-- Nếu văn bản cha không còn tồn tại (đang trong luồng ON DELETE CASCADE của documents_vanbanden), bỏ qua không chặn
IF NOT EXISTS (SELECT 1 FROM documents_vanbanden WHERE id = OLD.vanbanden_id) THEN
RETURN OLD;
END IF;

IF EXISTS (
SELECT 1 FROM documents_vanbanden_danhmuc dm
JOIN records_loaivanban lvb ON dm.loaivanban_id = lvb.id
WHERE dm.vanbanden_id = OLD.vanbanden_id AND lvb.ho_so_id = OLD.hoso_id
) THEN
RAISE EXCEPTION 'Không thể gỡ Hồ sơ (id=%) khỏi Văn bản đến (id=%): văn bản vẫn còn chứa Loại văn bản thuộc Hồ sơ này.',
OLD.hoso_id, OLD.vanbanden_id;
END IF;
RETURN OLD;
END;

$$;


ALTER FUNCTION public.check_vanbanden_hoso_delete_cross_ref() OWNER TO postgres;

--
-- Name: check_vanbandi_cross_reference(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_vanbandi_cross_reference() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE
v_hoso_id BIGINT;
BEGIN
SELECT ho_so_id INTO v_hoso_id FROM records_loaivanban WHERE id = NEW.loaivanban_id;
IF EXISTS (SELECT 1 FROM documents_vanbandi_hoso WHERE vanbandi_id = NEW.vanbandi_id) THEN
IF NOT EXISTS (
SELECT 1 FROM documents_vanbandi_hoso
WHERE vanbandi_id = NEW.vanbandi_id AND hoso_id = v_hoso_id
) THEN
RAISE EXCEPTION 'Vi phạm toàn vẹn tham chiếu chéo: Loại văn bản (id=%) thuộc Hồ sơ (id=%), nhưng Văn bản đi (id=%) không liên kết với Hồ sơ này.',
NEW.loaivanban_id, v_hoso_id, NEW.vanbandi_id;
END IF;
END IF;
RETURN NEW;
END;

$$;


ALTER FUNCTION public.check_vanbandi_cross_reference() OWNER TO postgres;

--
-- Name: check_vanbandi_hoso_delete_cross_ref(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_vanbandi_hoso_delete_cross_ref() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN
-- Nếu văn bản cha không còn tồn tại (đang trong luồng ON DELETE CASCADE của documents_vanbandi), bỏ qua không chặn
IF NOT EXISTS (SELECT 1 FROM documents_vanbandi WHERE id = OLD.vanbandi_id) THEN
RETURN OLD;
END IF;

IF EXISTS (
SELECT 1 FROM documents_vanbandi_danhmuc dm
JOIN records_loaivanban lvb ON dm.loaivanban_id = lvb.id
WHERE dm.vanbandi_id = OLD.vanbandi_id AND lvb.ho_so_id = OLD.hoso_id
) THEN
RAISE EXCEPTION 'Không thể gỡ Hồ sơ (id=%) khỏi Văn bản đi (id=%): văn bản vẫn còn chứa Loại văn bản thuộc Hồ sơ này.',
OLD.hoso_id, OLD.vanbandi_id;
END IF;
RETURN OLD;
END;

$$;


ALTER FUNCTION public.check_vanbandi_hoso_delete_cross_ref() OWNER TO postgres;

--
-- Name: prevent_change_pham_vi(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_change_pham_vi() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.pham_vi IS DISTINCT FROM OLD.pham_vi THEN
        RAISE EXCEPTION 'Phạm vi văn bản (id=%) không được đổi sau khi tạo.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_change_pham_vi() OWNER TO postgres;

--
-- Name: prevent_delete_he_thong_hoso(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_delete_he_thong_hoso() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN
IF OLD.is_he_thong = TRUE THEN
RAISE EXCEPTION 'Không thể xóa Hồ sơ chung / bản ghi hệ thống (records_hoso id=%).', OLD.id;
END IF;
RETURN OLD;
END;

$$;


ALTER FUNCTION public.prevent_delete_he_thong_hoso() OWNER TO postgres;

--
-- Name: prevent_delete_or_tamper_signing_signature(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_delete_or_tamper_signing_signature() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Chữ ký số điện tử (signing_signature id=%) là bất biến và không thể xóa khỏi CSDL.', OLD.id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (to_jsonb(OLD) - 'trang_thai_xac_minh' - 'thoi_diem_xac_minh')
           IS DISTINCT FROM
           (to_jsonb(NEW) - 'trang_thai_xac_minh' - 'thoi_diem_xac_minh') THEN
            RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Không được phép sửa đổi thông tin cốt lõi của chữ ký số (signing_signature id=%). Chỉ cho phép cập nhật kết quả xác minh.', OLD.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_delete_or_tamper_signing_signature() OWNER TO postgres;

--
-- Name: prevent_delete_signing_attempt(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_delete_signing_attempt() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.trang_thai <> 'NHAP' THEN
        RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Không thể xóa lượt trình ký (signing_attempt id=%) đã kích hoạt (trạng thái: %).', OLD.id, OLD.trang_thai;
    END IF;
    IF EXISTS (SELECT 1 FROM signing_manifest WHERE luot_trinh_id = OLD.id) THEN
        RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Lượt trình ký (id=%) đã có manifest số, không thể xóa.', OLD.id;
    END IF;
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.prevent_delete_signing_attempt() OWNER TO postgres;

--
-- Name: prevent_delete_van_ban_han_che(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_delete_van_ban_han_che() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.pham_vi = 'HAN_CHE' THEN
        RAISE EXCEPTION 'Văn bản hạn chế (id=%) không được xóa.', OLD.id;
    END IF;
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.prevent_delete_van_ban_han_che() OWNER TO postgres;

--
-- Name: prevent_modify_documents_access_log(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_modify_documents_access_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'Nhật ký truy cập văn bản hạn chế (documents_access_log id=%) chỉ được thêm, nghiêm cấm sửa hoặc xóa.', OLD.id;
END;
$$;


ALTER FUNCTION public.prevent_modify_documents_access_log() OWNER TO postgres;

--
-- Name: prevent_modify_signing_audit_log(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_modify_signing_audit_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Nhật ký kiểm toán (signing_audit_log id=%) tuân thủ chuẩn WORM, nghiêm cấm mọi hành vi sửa đổi hoặc xóa.', OLD.id;
END;
$$;


ALTER FUNCTION public.prevent_modify_signing_audit_log() OWNER TO postgres;

--
-- Name: prevent_update_he_thong_hoso(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_update_he_thong_hoso() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN
IF OLD.is_he_thong = TRUE AND NEW.is_he_thong = FALSE THEN
RAISE EXCEPTION 'Bảo toàn Hồ sơ hệ thống: Không thể gỡ bỏ cờ is_he_thong từ TRUE sang FALSE (records_hoso id=%).', OLD.id;
END IF;
RETURN NEW;
END;

$$;


ALTER FUNCTION public.prevent_update_he_thong_hoso() OWNER TO postgres;

--
-- Name: protect_final_manifest(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_final_manifest() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.trang_thai IN ('DA_CHOT', 'CHOT', 'FINAL') THEN
            RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Không thể xóa manifest số đã chốt (signing_manifest id=%, phien_ban=%).', OLD.id, OLD.phien_ban_bang_chung;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.trang_thai IN ('DA_CHOT', 'CHOT', 'FINAL') THEN
            RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Manifest số đã chốt (DA_CHOT) là bất biến và không thể sửa đổi (signing_manifest id=%).', OLD.id;
        END IF;
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.protect_final_manifest() OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;

$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- Name: trg_cleanup_viewlog_on_doc_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_cleanup_viewlog_on_doc_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM documents_view_log
    WHERE document_id = OLD.id AND document_type = TG_ARGV[0]::document_kind;
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.trg_cleanup_viewlog_on_doc_delete() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts_employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts_employee (
    id bigint NOT NULL,
    ho_ten character varying(150) NOT NULL,
    ngay_sinh date NOT NULL,
    chuc_vu_id bigint NOT NULL,
    chuc_danh character varying(150),
    email character varying(254),
    sdt character varying(20),
    don_vi_id bigint NOT NULL,
    username character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_staff boolean DEFAULT false NOT NULL,
    is_superuser boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    trang_thai public.employee_work_status DEFAULT 'LAM_VIEC'::public.employee_work_status NOT NULL,
    ghi_chu text,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.accounts_employee OWNER TO postgres;

--
-- Name: accounts_employee_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts_employee_groups (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    group_id bigint NOT NULL
);


ALTER TABLE public.accounts_employee_groups OWNER TO postgres;

--
-- Name: accounts_employee_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accounts_employee_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_employee_groups_id_seq OWNER TO postgres;

--
-- Name: accounts_employee_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounts_employee_groups_id_seq OWNED BY public.accounts_employee_groups.id;


--
-- Name: accounts_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accounts_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_employee_id_seq OWNER TO postgres;

--
-- Name: accounts_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounts_employee_id_seq OWNED BY public.accounts_employee.id;


--
-- Name: accounts_employee_user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts_employee_user_permissions (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    permission_id bigint NOT NULL
);


ALTER TABLE public.accounts_employee_user_permissions OWNER TO postgres;

--
-- Name: accounts_employee_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accounts_employee_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_employee_user_permissions_id_seq OWNER TO postgres;

--
-- Name: accounts_employee_user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounts_employee_user_permissions_id_seq OWNED BY public.accounts_employee_user_permissions.id;


--
-- Name: accounts_position; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts_position (
    id bigint NOT NULL,
    display_order integer NOT NULL,
    name character varying(255) NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    note text
);


ALTER TABLE public.accounts_position OWNER TO postgres;

--
-- Name: accounts_position_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accounts_position_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_position_id_seq OWNER TO postgres;

--
-- Name: accounts_position_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounts_position_id_seq OWNED BY public.accounts_position.id;


--
-- Name: records_chitiettailieu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.records_chitiettailieu (
    id bigint NOT NULL,
    dm_tai_lieu bigint NOT NULL,
    ky_hieu character varying(255),
    tieu_de character varying(255) NOT NULL,
    ngay_dang date NOT NULL,
    noi_ban_hanh character varying(255),
    hieu_luc public.hieu_luc_status NOT NULL,
    ngay_het_hieu_luc date,
    link_thay_the character varying(500),
    ghi_chu text,
    hien_thi public.chitiettailieu_hienthi NOT NULL,
    don_vi_id bigint,
    nguoi_tao_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.records_chitiettailieu OWNER TO postgres;

--
-- Name: ai_tailieu; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ai_tailieu WITH (security_barrier='true') AS
 SELECT id,
    ky_hieu,
    tieu_de,
    ngay_dang,
    noi_ban_hanh,
    hieu_luc,
    ngay_het_hieu_luc,
    ghi_chu,
    updated_at
   FROM public.records_chitiettailieu t
  WHERE (((hien_thi)::text = 'TAT_CA'::text) OR (((hien_thi)::text = 'NOI_BO_PHONG_BAN'::text) AND (don_vi_id = ( SELECT e.don_vi_id
           FROM public.accounts_employee e
          WHERE ((e.id = (NULLIF(current_setting('qlvb.employee_id'::text, true), ''::text))::bigint) AND (e.is_active IS TRUE) AND ((e.trang_thai)::text = 'LAM_VIEC'::text))))));


ALTER VIEW public.ai_tailieu OWNER TO postgres;

--
-- Name: documents_vanbanden; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbanden (
    id bigint NOT NULL,
    nam smallint NOT NULL,
    so_hieu character varying(255) NOT NULL,
    so_thu_tu integer NOT NULL,
    ngay_den timestamp with time zone NOT NULL,
    trich_yeu text NOT NULL,
    noi_ban_hanh character varying(500),
    ngay_van_ban timestamp with time zone,
    nguoi_ky character varying(255),
    chuc_vu character varying(255),
    hieu_luc public.hieu_luc_status NOT NULL,
    ngay_het_hieu_luc timestamp with time zone,
    link_thay_the character varying(500),
    ghi_chu text,
    hien_thi boolean DEFAULT true NOT NULL,
    gui_mail_toan_he_thong boolean DEFAULT false NOT NULL,
    pham_vi character varying(20) DEFAULT 'NOI_BO'::character varying NOT NULL,
    nguoi_tao_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_vanbanden_han_che_khong_mail_toan_he_thong CHECK ((((pham_vi)::text <> 'HAN_CHE'::text) OR (gui_mail_toan_he_thong = false))),
    CONSTRAINT chk_vanbanden_link_thay_the CHECK (((hieu_luc <> 'HET_VA_THAY_THE'::public.hieu_luc_status) OR ((link_thay_the IS NOT NULL) AND (btrim((link_thay_the)::text) <> ''::text)))),
    CONSTRAINT chk_vanbanden_pham_vi CHECK (((pham_vi)::text = ANY ((ARRAY['NOI_BO'::character varying, 'HAN_CHE'::character varying])::text[])))
);


ALTER TABLE public.documents_vanbanden OWNER TO postgres;

--
-- Name: ai_vanbanden; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ai_vanbanden WITH (security_barrier='true') AS
 SELECT id,
    so_hieu,
    so_thu_tu,
    nam,
    ngay_den,
    trich_yeu,
    noi_ban_hanh,
    ngay_van_ban,
    nguoi_ky,
    chuc_vu,
    hieu_luc,
    ngay_het_hieu_luc,
    ghi_chu,
    updated_at
   FROM public.documents_vanbanden
  WHERE (((pham_vi)::text = 'NOI_BO'::text) AND (hien_thi IS TRUE));


ALTER VIEW public.ai_vanbanden OWNER TO postgres;

--
-- Name: documents_vanbanden_donvinhan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbanden_donvinhan (
    vanbanden_id bigint NOT NULL,
    donvi_id bigint NOT NULL
);


ALTER TABLE public.documents_vanbanden_donvinhan OWNER TO postgres;

--
-- Name: ai_vanbanden_donvinhan; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ai_vanbanden_donvinhan WITH (security_barrier='true') AS
 SELECT dv.vanbanden_id,
    dv.donvi_id
   FROM (public.documents_vanbanden_donvinhan dv
     JOIN public.documents_vanbanden vb ON ((vb.id = dv.vanbanden_id)))
  WHERE (((vb.pham_vi)::text = 'NOI_BO'::text) AND (vb.hien_thi IS TRUE));


ALTER VIEW public.ai_vanbanden_donvinhan OWNER TO postgres;

--
-- Name: documents_vanbanden_nguoinhan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbanden_nguoinhan (
    vanbanden_id bigint NOT NULL,
    employee_id bigint NOT NULL
);


ALTER TABLE public.documents_vanbanden_nguoinhan OWNER TO postgres;

--
-- Name: ai_vanbanden_nguoinhan; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ai_vanbanden_nguoinhan WITH (security_barrier='true') AS
 SELECT nn.vanbanden_id,
    nn.employee_id
   FROM (public.documents_vanbanden_nguoinhan nn
     JOIN public.documents_vanbanden vb ON ((vb.id = nn.vanbanden_id)))
  WHERE (((vb.pham_vi)::text = 'NOI_BO'::text) AND (vb.hien_thi IS TRUE));


ALTER VIEW public.ai_vanbanden_nguoinhan OWNER TO postgres;

--
-- Name: documents_vanbandi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbandi (
    id bigint NOT NULL,
    nam smallint NOT NULL,
    so_hieu character varying(255) NOT NULL,
    so_thu_tu integer NOT NULL,
    ngay_ban_hanh timestamp with time zone NOT NULL,
    trich_yeu text NOT NULL,
    ngay_van_ban timestamp with time zone NOT NULL,
    nguoi_ky character varying(255),
    chuc_vu character varying(255),
    hieu_luc public.hieu_luc_status NOT NULL,
    ngay_het_hieu_luc timestamp with time zone,
    link_thay_the character varying(500),
    ghi_chu text,
    hien_thi boolean DEFAULT true NOT NULL,
    gui_mail_toan_he_thong boolean DEFAULT false NOT NULL,
    pham_vi character varying(20) DEFAULT 'NOI_BO'::character varying NOT NULL,
    nguoi_tao_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_vanbandi_han_che_khong_mail_toan_he_thong CHECK ((((pham_vi)::text <> 'HAN_CHE'::text) OR (gui_mail_toan_he_thong = false))),
    CONSTRAINT chk_vanbandi_link_thay_the CHECK (((hieu_luc <> 'HET_VA_THAY_THE'::public.hieu_luc_status) OR ((link_thay_the IS NOT NULL) AND (btrim((link_thay_the)::text) <> ''::text)))),
    CONSTRAINT chk_vanbandi_pham_vi CHECK (((pham_vi)::text = ANY ((ARRAY['NOI_BO'::character varying, 'HAN_CHE'::character varying])::text[])))
);


ALTER TABLE public.documents_vanbandi OWNER TO postgres;

--
-- Name: documents_vanbandi_noibanhanh; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbandi_noibanhanh (
    vanbandi_id bigint NOT NULL,
    donvi_id bigint NOT NULL
);


ALTER TABLE public.documents_vanbandi_noibanhanh OWNER TO postgres;

--
-- Name: organizations_donvi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations_donvi (
    id bigint NOT NULL,
    khoi_id bigint NOT NULL,
    stt_uu_tien integer NOT NULL,
    ten character varying(255) NOT NULL,
    dia_chi character varying(255),
    dien_thoai character varying(20),
    email character varying(254),
    is_public boolean DEFAULT true NOT NULL,
    ghi_chu text
);


ALTER TABLE public.organizations_donvi OWNER TO postgres;

--
-- Name: ai_vanbandi; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ai_vanbandi WITH (security_barrier='true') AS
 SELECT id,
    so_hieu,
    so_thu_tu,
    nam,
    ngay_ban_hanh,
    trich_yeu,
    ( SELECT string_agg((dv.ten)::text, ', '::text ORDER BY (dv.ten)::text) AS string_agg
           FROM (public.documents_vanbandi_noibanhanh nb
             JOIN public.organizations_donvi dv ON ((dv.id = nb.donvi_id)))
          WHERE (nb.vanbandi_id = vb.id)) AS noi_ban_hanh,
    ngay_van_ban,
    nguoi_ky,
    chuc_vu,
    hieu_luc,
    ngay_het_hieu_luc,
    ghi_chu,
    updated_at
   FROM public.documents_vanbandi vb
  WHERE (((pham_vi)::text = 'NOI_BO'::text) AND (hien_thi IS TRUE));


ALTER VIEW public.ai_vanbandi OWNER TO postgres;

--
-- Name: documents_vanbandi_donvinhan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbandi_donvinhan (
    vanbandi_id bigint NOT NULL,
    donvi_id bigint NOT NULL
);


ALTER TABLE public.documents_vanbandi_donvinhan OWNER TO postgres;

--
-- Name: ai_vanbandi_donvinhan; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ai_vanbandi_donvinhan WITH (security_barrier='true') AS
 SELECT dv.vanbandi_id,
    dv.donvi_id
   FROM (public.documents_vanbandi_donvinhan dv
     JOIN public.documents_vanbandi vb ON ((vb.id = dv.vanbandi_id)))
  WHERE (((vb.pham_vi)::text = 'NOI_BO'::text) AND (vb.hien_thi IS TRUE));


ALTER VIEW public.ai_vanbandi_donvinhan OWNER TO postgres;

--
-- Name: documents_vanbandi_nguoinhan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbandi_nguoinhan (
    vanbandi_id bigint NOT NULL,
    employee_id bigint NOT NULL
);


ALTER TABLE public.documents_vanbandi_nguoinhan OWNER TO postgres;

--
-- Name: ai_vanbandi_nguoinhan; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ai_vanbandi_nguoinhan WITH (security_barrier='true') AS
 SELECT nn.vanbandi_id,
    nn.employee_id
   FROM (public.documents_vanbandi_nguoinhan nn
     JOIN public.documents_vanbandi vb ON ((vb.id = nn.vanbandi_id)))
  WHERE (((vb.pham_vi)::text = 'NOI_BO'::text) AND (vb.hien_thi IS TRUE));


ALTER VIEW public.ai_vanbandi_nguoinhan OWNER TO postgres;

--
-- Name: ai_vanbandi_noibanhanh; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ai_vanbandi_noibanhanh WITH (security_barrier='true') AS
 SELECT nb.vanbandi_id,
    nb.donvi_id
   FROM (public.documents_vanbandi_noibanhanh nb
     JOIN public.documents_vanbandi vb ON ((vb.id = nb.vanbandi_id)))
  WHERE (((vb.pham_vi)::text = 'NOI_BO'::text) AND (vb.hien_thi IS TRUE));


ALTER VIEW public.ai_vanbandi_noibanhanh OWNER TO postgres;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group (
    id bigint NOT NULL,
    name character varying(150) NOT NULL,
    ma_nhom_quyen character varying(50)
);


ALTER TABLE public.auth_group OWNER TO postgres;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_group_id_seq OWNER TO postgres;

--
-- Name: auth_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auth_group_id_seq OWNED BY public.auth_group.id;


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id bigint NOT NULL,
    permission_id bigint NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO postgres;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_group_permissions_id_seq OWNER TO postgres;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auth_group_permissions_id_seq OWNED BY public.auth_group_permissions.id;


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_permission (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id bigint,
    codename character varying(100) NOT NULL,
    module_ten character varying(150) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO postgres;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_permission_id_seq OWNER TO postgres;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auth_permission_id_seq OWNED BY public.auth_permission.id;


--
-- Name: birthdays_birthdayemaillog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.birthdays_birthdayemaillog (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    sent_date date NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    recipient_email character varying(254) NOT NULL,
    subject character varying(255) NOT NULL,
    card_template character varying(50) DEFAULT 'GOLDEN'::character varying NOT NULL,
    trang_thai public.emaillog_status DEFAULT 'PENDING'::public.emaillog_status NOT NULL,
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    next_retry_at timestamp with time zone,
    smtp_response_code character varying(50),
    opened_at timestamp with time zone,
    clicked_count integer DEFAULT 0 NOT NULL,
    email_provider character varying(50),
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.birthdays_birthdayemaillog OWNER TO postgres;

--
-- Name: birthdays_birthdayemaillog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.birthdays_birthdayemaillog_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.birthdays_birthdayemaillog_id_seq OWNER TO postgres;

--
-- Name: birthdays_birthdayemaillog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.birthdays_birthdayemaillog_id_seq OWNED BY public.birthdays_birthdayemaillog.id;


--
-- Name: birthdays_birthdaywish; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.birthdays_birthdaywish (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    sender_name character varying(150) NOT NULL,
    message text NOT NULL,
    card_template character varying(50) DEFAULT 'GOLDEN'::character varying NOT NULL,
    is_anonymous boolean DEFAULT false NOT NULL,
    trang_thai public.birthdaywish_status DEFAULT 'APPROVED'::public.birthdaywish_status NOT NULL,
    sticker_url character varying(500),
    likes_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.birthdays_birthdaywish OWNER TO postgres;

--
-- Name: birthdays_birthdaywish_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.birthdays_birthdaywish_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.birthdays_birthdaywish_id_seq OWNER TO postgres;

--
-- Name: birthdays_birthdaywish_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.birthdays_birthdaywish_id_seq OWNED BY public.birthdays_birthdaywish.id;


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    name character varying(100) DEFAULT ''::character varying,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO postgres;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO postgres;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: documents_access_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_access_log (
    id bigint NOT NULL,
    document_type public.document_kind NOT NULL,
    document_id bigint NOT NULL,
    user_id bigint NOT NULL,
    hanh_dong character varying(20) NOT NULL,
    doi_tuong_user_id bigint,
    tep_id bigint,
    dia_chi_ip character varying(45),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_access_log_doi_tuong CHECK ((((hanh_dong)::text <> ALL ((ARRAY['THEM_NGUOI_XEM'::character varying, 'BOT_NGUOI_XEM'::character varying])::text[])) OR (doi_tuong_user_id IS NOT NULL))),
    CONSTRAINT chk_access_log_hanh_dong CHECK (((hanh_dong)::text = ANY ((ARRAY['XEM'::character varying, 'TAI_FILE'::character varying, 'BI_TU_CHOI'::character varying, 'THEM_NGUOI_XEM'::character varying, 'BOT_NGUOI_XEM'::character varying])::text[])))
);


ALTER TABLE public.documents_access_log OWNER TO postgres;

--
-- Name: documents_access_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_access_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_access_log_id_seq OWNER TO postgres;

--
-- Name: documents_access_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_access_log_id_seq OWNED BY public.documents_access_log.id;


--
-- Name: documents_vanbanden_attachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbanden_attachment (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    path character varying(500) NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nguoi_tao_id bigint
);


ALTER TABLE public.documents_vanbanden_attachment OWNER TO postgres;

--
-- Name: documents_vanbanden_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_vanbanden_attachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_vanbanden_attachment_id_seq OWNER TO postgres;

--
-- Name: documents_vanbanden_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_vanbanden_attachment_id_seq OWNED BY public.documents_vanbanden_attachment.id;


--
-- Name: documents_vanbanden_danhmuc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbanden_danhmuc (
    vanbanden_id bigint NOT NULL,
    loaivanban_id bigint NOT NULL
);


ALTER TABLE public.documents_vanbanden_danhmuc OWNER TO postgres;

--
-- Name: documents_vanbanden_hoso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbanden_hoso (
    vanbanden_id bigint NOT NULL,
    hoso_id bigint NOT NULL
);


ALTER TABLE public.documents_vanbanden_hoso OWNER TO postgres;

--
-- Name: documents_vanbanden_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_vanbanden_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_vanbanden_id_seq OWNER TO postgres;

--
-- Name: documents_vanbanden_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_vanbanden_id_seq OWNED BY public.documents_vanbanden.id;


--
-- Name: documents_vanbandi_attachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbandi_attachment (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    path character varying(500) NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nguoi_tao_id bigint
);


ALTER TABLE public.documents_vanbandi_attachment OWNER TO postgres;

--
-- Name: documents_vanbandi_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_vanbandi_attachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_vanbandi_attachment_id_seq OWNER TO postgres;

--
-- Name: documents_vanbandi_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_vanbandi_attachment_id_seq OWNED BY public.documents_vanbandi_attachment.id;


--
-- Name: documents_vanbandi_danhmuc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbandi_danhmuc (
    vanbandi_id bigint NOT NULL,
    loaivanban_id bigint NOT NULL
);


ALTER TABLE public.documents_vanbandi_danhmuc OWNER TO postgres;

--
-- Name: documents_vanbandi_hoso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_vanbandi_hoso (
    vanbandi_id bigint NOT NULL,
    hoso_id bigint NOT NULL
);


ALTER TABLE public.documents_vanbandi_hoso OWNER TO postgres;

--
-- Name: documents_vanbandi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_vanbandi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_vanbandi_id_seq OWNER TO postgres;

--
-- Name: documents_vanbandi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_vanbandi_id_seq OWNED BY public.documents_vanbandi.id;


--
-- Name: documents_view_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_view_log (
    id bigint NOT NULL,
    document_type public.document_kind NOT NULL,
    document_id bigint NOT NULL,
    user_id bigint NOT NULL,
    viewed_at timestamp with time zone NOT NULL
);


ALTER TABLE public.documents_view_log OWNER TO postgres;

--
-- Name: documents_view_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_view_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_view_log_id_seq OWNER TO postgres;

--
-- Name: documents_view_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_view_log_id_seq OWNED BY public.documents_view_log.id;


--
-- Name: meetings_meetingbooking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meetings_meetingbooking (
    id bigint NOT NULL,
    room_id bigint NOT NULL,
    organizer_id bigint NOT NULL,
    department_id bigint,
    title character varying(255) NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    attendees_count integer DEFAULT 1 NOT NULL,
    purpose text,
    trang_thai public.meetingbooking_status DEFAULT 'CONFIRMED'::public.meetingbooking_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_booking_time CHECK ((end_time > start_time)),
    CONSTRAINT meetings_meetingbooking_attendees_count_check CHECK ((attendees_count > 0))
);


ALTER TABLE public.meetings_meetingbooking OWNER TO postgres;

--
-- Name: meetings_meetingbooking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meetings_meetingbooking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meetings_meetingbooking_id_seq OWNER TO postgres;

--
-- Name: meetings_meetingbooking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meetings_meetingbooking_id_seq OWNED BY public.meetings_meetingbooking.id;


--
-- Name: meetings_meetingroom; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meetings_meetingroom (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    location character varying(200) NOT NULL,
    capacity integer NOT NULL,
    amenities text,
    is_public boolean DEFAULT true NOT NULL,
    trang_thai public.meetingroom_status DEFAULT 'AVAILABLE'::public.meetingroom_status NOT NULL,
    ghi_chu text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT meetings_meetingroom_capacity_check CHECK ((capacity > 0))
);


ALTER TABLE public.meetings_meetingroom OWNER TO postgres;

--
-- Name: meetings_meetingroom_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meetings_meetingroom_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meetings_meetingroom_id_seq OWNER TO postgres;

--
-- Name: meetings_meetingroom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meetings_meetingroom_id_seq OWNED BY public.meetings_meetingroom.id;


--
-- Name: organizations_donvi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_donvi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizations_donvi_id_seq OWNER TO postgres;

--
-- Name: organizations_donvi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_donvi_id_seq OWNED BY public.organizations_donvi.id;


--
-- Name: organizations_khoi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations_khoi (
    id bigint NOT NULL,
    ten character varying(255) NOT NULL,
    thu_tu_hien_thi integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.organizations_khoi OWNER TO postgres;

--
-- Name: organizations_khoi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_khoi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizations_khoi_id_seq OWNER TO postgres;

--
-- Name: organizations_khoi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_khoi_id_seq OWNED BY public.organizations_khoi.id;


--
-- Name: records_chitiettailieu_attachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.records_chitiettailieu_attachment (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    path character varying(500) NOT NULL,
    file_size bigint,
    mime_type character varying(255),
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nguoi_tao_id bigint,
    CONSTRAINT records_chitiettailieu_attachment_file_size_check CHECK ((file_size >= 0))
);


ALTER TABLE public.records_chitiettailieu_attachment OWNER TO postgres;

--
-- Name: records_chitiettailieu_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.records_chitiettailieu_attachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.records_chitiettailieu_attachment_id_seq OWNER TO postgres;

--
-- Name: records_chitiettailieu_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.records_chitiettailieu_attachment_id_seq OWNED BY public.records_chitiettailieu_attachment.id;


--
-- Name: records_chitiettailieu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.records_chitiettailieu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.records_chitiettailieu_id_seq OWNER TO postgres;

--
-- Name: records_chitiettailieu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.records_chitiettailieu_id_seq OWNED BY public.records_chitiettailieu.id;


--
-- Name: records_chitiettailieu_loaitailieu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.records_chitiettailieu_loaitailieu (
    chitiettailieu_id bigint NOT NULL,
    loaitailieu_id bigint NOT NULL
);


ALTER TABLE public.records_chitiettailieu_loaitailieu OWNER TO postgres;

--
-- Name: records_hoso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.records_hoso (
    id bigint NOT NULL,
    stt_uu_tien integer NOT NULL,
    so_ky_hieu character varying(255) NOT NULL,
    ten_ho_so character varying(255) NOT NULL,
    nguoi_lap_id bigint NOT NULL,
    ngay_lap timestamp with time zone,
    ghi_chu text,
    is_he_thong boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT records_hoso_so_ky_hieu_check CHECK ((btrim((so_ky_hieu)::text) <> ''::text)),
    CONSTRAINT records_hoso_stt_uu_tien_check CHECK ((stt_uu_tien > 0)),
    CONSTRAINT records_hoso_ten_ho_so_check CHECK ((btrim((ten_ho_so)::text) <> ''::text))
);


ALTER TABLE public.records_hoso OWNER TO postgres;

--
-- Name: records_hoso_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.records_hoso_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.records_hoso_id_seq OWNER TO postgres;

--
-- Name: records_hoso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.records_hoso_id_seq OWNED BY public.records_hoso.id;


--
-- Name: records_loaitailieu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.records_loaitailieu (
    id bigint NOT NULL,
    dm_tai_lieu bigint NOT NULL,
    ten_loai character varying(255) NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    ngay_lap timestamp with time zone,
    ghi_chu text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.records_loaitailieu OWNER TO postgres;

--
-- Name: records_loaitailieu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.records_loaitailieu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.records_loaitailieu_id_seq OWNER TO postgres;

--
-- Name: records_loaitailieu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.records_loaitailieu_id_seq OWNED BY public.records_loaitailieu.id;


--
-- Name: records_loaivanban; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.records_loaivanban (
    id bigint NOT NULL,
    ho_so_id bigint NOT NULL,
    ten_loai character varying(255) NOT NULL,
    ngay_lap timestamp with time zone,
    ghi_chu text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT records_loaivanban_ten_loai_check CHECK ((btrim((ten_loai)::text) <> ''::text))
);


ALTER TABLE public.records_loaivanban OWNER TO postgres;

--
-- Name: records_loaivanban_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.records_loaivanban_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.records_loaivanban_id_seq OWNER TO postgres;

--
-- Name: records_loaivanban_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.records_loaivanban_id_seq OWNED BY public.records_loaivanban.id;


--
-- Name: records_tailieu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.records_tailieu (
    id bigint NOT NULL,
    stt_uu_tien smallint NOT NULL,
    ky_hieu character varying(255),
    ten_tai_lieu character varying(255) NOT NULL,
    nguoi_lap_id bigint NOT NULL,
    ngay_lap date,
    ghi_chu text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.records_tailieu OWNER TO postgres;

--
-- Name: records_tailieu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.records_tailieu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.records_tailieu_id_seq OWNER TO postgres;

--
-- Name: records_tailieu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.records_tailieu_id_seq OWNED BY public.records_tailieu.id;


--
-- Name: signing_attempt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_attempt (
    id bigint NOT NULL,
    trinh_ky_id bigint NOT NULL,
    so_luot smallint NOT NULL,
    phien_ban_van_ban character varying(50),
    vi_tri_luu_tep character varying(500) NOT NULL,
    ma_bam_tai_lieu character varying(64) NOT NULL,
    trang_thai character varying(20) DEFAULT 'NHAP'::character varying NOT NULL,
    ly_do text DEFAULT ''::text NOT NULL,
    khoa_chong_trung character varying(255),
    thoi_diem_gui timestamp with time zone,
    thoi_diem_hoan_thanh timestamp with time zone,
    thoi_diem_tu_choi timestamp with time zone,
    thoi_diem_huy timestamp with time zone,
    vi_tri_tep_hoan_tat character varying(500) DEFAULT ''::character varying NOT NULL,
    ma_bam_tep_hoan_tat character varying(64) DEFAULT ''::character varying NOT NULL,
    trang_thai_tep_hoan_tat character varying(20),
    loi_tep_hoan_tat character varying(100) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nguoi_tao_id bigint NOT NULL,
    luot_truoc_id bigint,
    nguoi_cap_nhat_id bigint,
    CONSTRAINT chk_signing_attempt_ma_bam_sha256 CHECK (((ma_bam_tai_lieu)::text ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT signing_attempt_so_luot_check CHECK ((so_luot >= 0))
);


ALTER TABLE public.signing_attempt OWNER TO postgres;

--
-- Name: signing_attempt_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_attempt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_attempt_id_seq OWNER TO postgres;

--
-- Name: signing_attempt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_attempt_id_seq OWNED BY public.signing_attempt.id;


--
-- Name: signing_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_audit_log (
    id bigint NOT NULL,
    trinh_ky_id bigint,
    luot_trinh_id bigint,
    buoc_ky_id bigint,
    loai_doi_tuong character varying(50) NOT NULL,
    ma_doi_tuong bigint NOT NULL,
    nguoi_thuc_hien_id bigint NOT NULL,
    hanh_dong character varying(50) NOT NULL,
    trang_thai_truoc character varying(20) DEFAULT ''::character varying NOT NULL,
    trang_thai_sau character varying(20) DEFAULT ''::character varying NOT NULL,
    chi_tiet text DEFAULT ''::text NOT NULL,
    du_lieu_kem_theo jsonb,
    dia_chi_ip character varying(45),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_signing_audit_log_luong_ky_co_trinh_ky CHECK (((NOT ((loai_doi_tuong)::text = ANY ((ARRAY['signing_request'::character varying, 'signing_attempt'::character varying, 'signing_request_step_signer'::character varying, 'signing_signature'::character varying])::text[]))) OR (trinh_ky_id IS NOT NULL)))
);


ALTER TABLE public.signing_audit_log OWNER TO postgres;

--
-- Name: signing_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_audit_log_id_seq OWNER TO postgres;

--
-- Name: signing_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_audit_log_id_seq OWNED BY public.signing_audit_log.id;


--
-- Name: signing_change_message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_change_message (
    id bigint NOT NULL,
    yeu_cau_sua_id bigint NOT NULL,
    nguoi_viet_id bigint NOT NULL,
    noi_dung text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.signing_change_message OWNER TO postgres;

--
-- Name: signing_change_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_change_message_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_change_message_id_seq OWNER TO postgres;

--
-- Name: signing_change_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_change_message_id_seq OWNED BY public.signing_change_message.id;


--
-- Name: signing_change_thread; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_change_thread (
    id bigint NOT NULL,
    luot_trinh_id bigint NOT NULL,
    nguoi_yeu_cau_id bigint NOT NULL,
    tieu_de character varying(255) NOT NULL,
    ly_do text NOT NULL,
    trang_thai character varying(20) DEFAULT 'DANG_MO'::character varying NOT NULL,
    thoi_diem_giai_quyet timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.signing_change_thread OWNER TO postgres;

--
-- Name: signing_change_thread_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_change_thread_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_change_thread_id_seq OWNER TO postgres;

--
-- Name: signing_change_thread_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_change_thread_id_seq OWNED BY public.signing_change_thread.id;


--
-- Name: signing_key; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_key (
    id bigint NOT NULL,
    nguoi_so_huu_id bigint NOT NULL,
    ma_khoa character varying(100) NOT NULL,
    dau_van_tay character varying(64) NOT NULL,
    thuat_toan character varying(50) DEFAULT 'Ed25519'::character varying NOT NULL,
    khoa_cong_khai text NOT NULL,
    trang_thai character varying(20) DEFAULT 'CHO_KICH_HOAT'::character varying NOT NULL,
    thoi_diem_xac_minh_so_huu timestamp with time zone,
    thoi_diem_kich_hoat timestamp with time zone,
    ngay_hieu_luc timestamp with time zone NOT NULL,
    ngay_het_han timestamp with time zone,
    ngay_thu_hoi timestamp with time zone,
    ghi_chu text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    khoa_thay_the_id bigint,
    CONSTRAINT chk_signing_key_hoat_dong_da_xac_minh CHECK (((NOT ((trang_thai)::text = 'HOAT_DONG'::text)) OR (thoi_diem_xac_minh_so_huu IS NOT NULL)))
);


ALTER TABLE public.signing_key OWNER TO postgres;

--
-- Name: signing_key_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_key_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_key_id_seq OWNER TO postgres;

--
-- Name: signing_key_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_key_id_seq OWNED BY public.signing_key.id;


--
-- Name: signing_key_unlock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_key_unlock (
    id bigint NOT NULL,
    khoa_id bigint NOT NULL,
    ma_bam_xac_minh_pin text NOT NULL,
    manh_bi_mat_ma_hoa text NOT NULL,
    tham_so_kdf jsonb NOT NULL,
    so_lan_sai integer DEFAULT 0 NOT NULL,
    khoa_den timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT signing_key_unlock_so_lan_sai_check CHECK ((so_lan_sai >= 0))
);


ALTER TABLE public.signing_key_unlock OWNER TO postgres;

--
-- Name: signing_key_unlock_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_key_unlock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_key_unlock_id_seq OWNER TO postgres;

--
-- Name: signing_key_unlock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_key_unlock_id_seq OWNED BY public.signing_key_unlock.id;


--
-- Name: signing_manifest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_manifest (
    id bigint NOT NULL,
    luot_trinh_id bigint NOT NULL,
    phien_ban_bang_chung smallint DEFAULT 1 NOT NULL,
    noi_dung_chuan_hoa jsonb NOT NULL,
    ma_bam_bang_chung character varying(64) NOT NULL,
    vi_tri_luu character varying(500),
    trang_thai character varying(20) DEFAULT 'NHAP'::character varying NOT NULL,
    thoi_diem_chot timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nguoi_tao_id bigint NOT NULL,
    CONSTRAINT chk_signing_manifest_ma_bam_sha256 CHECK (((ma_bam_bang_chung)::text ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT signing_manifest_phien_ban_bang_chung_check CHECK ((phien_ban_bang_chung >= 0))
);


ALTER TABLE public.signing_manifest OWNER TO postgres;

--
-- Name: signing_manifest_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_manifest_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_manifest_id_seq OWNER TO postgres;

--
-- Name: signing_manifest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_manifest_id_seq OWNED BY public.signing_manifest.id;


--
-- Name: signing_notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_notification (
    id bigint NOT NULL,
    trinh_ky_id bigint NOT NULL,
    buoc_ky_id bigint,
    nguoi_nhan_id bigint NOT NULL,
    kenh character varying(20) NOT NULL,
    loai_thong_bao character varying(50) NOT NULL,
    trang_thai character varying(20) DEFAULT 'CHO_GUI'::character varying NOT NULL,
    hen_gio_gui timestamp with time zone,
    khoa_chong_gui_trung character varying(255) NOT NULL,
    so_lan_gui_lai integer DEFAULT 0 NOT NULL,
    thoi_diem_gui timestamp with time zone,
    loi_gui text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT signing_notification_so_lan_gui_lai_check CHECK ((so_lan_gui_lai >= 0))
);


ALTER TABLE public.signing_notification OWNER TO postgres;

--
-- Name: signing_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_notification_id_seq OWNER TO postgres;

--
-- Name: signing_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_notification_id_seq OWNED BY public.signing_notification.id;


--
-- Name: signing_process; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_process (
    id bigint NOT NULL,
    ma_quy_trinh character varying(50) NOT NULL,
    ten_quy_trinh character varying(255) NOT NULL,
    mo_ta text DEFAULT ''::text NOT NULL,
    phien_ban smallint DEFAULT 1 NOT NULL,
    trang_thai character varying(20) DEFAULT 'NHAP'::character varying NOT NULL,
    pham_vi character varying(20) NOT NULL,
    don_vi_ap_dung_id bigint,
    cau_hinh_nhac_han jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nguoi_tao_id bigint NOT NULL,
    nguoi_cap_nhat_id bigint,
    CONSTRAINT chk_signing_process_don_vi_ap_dung CHECK (((((pham_vi)::text = 'PHONG_BAN'::text) AND (don_vi_ap_dung_id IS NOT NULL)) OR (((pham_vi)::text = 'CONG_TY'::text) AND (don_vi_ap_dung_id IS NULL)))),
    CONSTRAINT signing_process_phien_ban_check CHECK ((phien_ban >= 0))
);


ALTER TABLE public.signing_process OWNER TO postgres;

--
-- Name: signing_process_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_process_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_process_id_seq OWNER TO postgres;

--
-- Name: signing_process_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_process_id_seq OWNED BY public.signing_process.id;


--
-- Name: signing_process_step; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_process_step (
    id bigint NOT NULL,
    quy_trinh_id bigint NOT NULL,
    cap_ky smallint NOT NULL,
    ten_cap_ky character varying(255) NOT NULL,
    thu_tu smallint NOT NULL,
    don_vi_id bigint,
    so_gio_xu_ly integer,
    dang_ap_dung boolean DEFAULT true NOT NULL,
    ghi_chu text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT signing_process_step_cap_ky_check CHECK ((cap_ky >= 0)),
    CONSTRAINT signing_process_step_so_gio_xu_ly_check CHECK ((so_gio_xu_ly >= 0)),
    CONSTRAINT signing_process_step_thu_tu_check CHECK ((thu_tu >= 0))
);


ALTER TABLE public.signing_process_step OWNER TO postgres;

--
-- Name: signing_process_step_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_process_step_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_process_step_id_seq OWNER TO postgres;

--
-- Name: signing_process_step_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_process_step_id_seq OWNED BY public.signing_process_step.id;


--
-- Name: signing_process_step_signer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_process_step_signer (
    id bigint NOT NULL,
    buoc_quy_trinh_id bigint NOT NULL,
    nguoi_ky_id bigint,
    chuc_vu_id bigint,
    pham_vi_chuc_vu character varying(20),
    vai_tro_ky character varying(20) DEFAULT 'KY_CHINH'::character varying NOT NULL,
    chan_ky_chinh boolean DEFAULT true NOT NULL,
    thu_tu smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_signing_process_step_signer_mot_doi_tuong CHECK ((((chuc_vu_id IS NULL) AND (nguoi_ky_id IS NOT NULL)) OR ((chuc_vu_id IS NOT NULL) AND (nguoi_ky_id IS NULL)))),
    CONSTRAINT signing_process_step_signer_thu_tu_check CHECK ((thu_tu >= 0))
);


ALTER TABLE public.signing_process_step_signer OWNER TO postgres;

--
-- Name: signing_process_step_signer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_process_step_signer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_process_step_signer_id_seq OWNER TO postgres;

--
-- Name: signing_process_step_signer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_process_step_signer_id_seq OWNED BY public.signing_process_step_signer.id;


--
-- Name: signing_request; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_request (
    id bigint NOT NULL,
    document_type public.document_kind NOT NULL,
    document_id bigint NOT NULL,
    phien_ban_van_ban character varying(50),
    vi_tri_luu_tep character varying(500),
    ma_bam_tai_lieu character varying(64),
    quy_trinh_id bigint NOT NULL,
    phien_ban_quy_trinh smallint NOT NULL,
    trang_thai character varying(20) DEFAULT 'NHAP'::character varying NOT NULL,
    han_chot timestamp with time zone,
    ngay_gui timestamp with time zone,
    ngay_hoan_thanh timestamp with time zone,
    ngay_tu_choi timestamp with time zone,
    ly_do_tu_choi text DEFAULT ''::text NOT NULL,
    ngay_huy timestamp with time zone,
    ly_do_huy text DEFAULT ''::text NOT NULL,
    ghi_chu text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nguoi_tao_id bigint NOT NULL,
    nguoi_cap_nhat_id bigint,
    ho_so_goc_id bigint,
    CONSTRAINT chk_signing_request_ma_bam_sha256 CHECK (((ma_bam_tai_lieu IS NULL) OR ((ma_bam_tai_lieu)::text ~ '^[0-9a-f]{64}$'::text))),
    CONSTRAINT signing_request_phien_ban_quy_trinh_check CHECK ((phien_ban_quy_trinh >= 0))
);


ALTER TABLE public.signing_request OWNER TO postgres;

--
-- Name: signing_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_request_id_seq OWNER TO postgres;

--
-- Name: signing_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_request_id_seq OWNED BY public.signing_request.id;


--
-- Name: signing_request_step; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_request_step (
    id bigint NOT NULL,
    luot_trinh_id bigint NOT NULL,
    buoc_quy_trinh_id bigint NOT NULL,
    cap_ky smallint NOT NULL,
    ten_cap_ky character varying(255) NOT NULL,
    thu_tu smallint NOT NULL,
    trang_thai character varying(20) DEFAULT 'CHUA_MO'::character varying NOT NULL,
    han_xu_ly timestamp with time zone,
    thoi_diem_mo timestamp with time zone,
    thoi_diem_hoan_thanh timestamp with time zone,
    ghi_chu text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT signing_request_step_cap_ky_check CHECK ((cap_ky >= 0)),
    CONSTRAINT signing_request_step_thu_tu_check CHECK ((thu_tu >= 0))
);


ALTER TABLE public.signing_request_step OWNER TO postgres;

--
-- Name: signing_request_step_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_request_step_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_request_step_id_seq OWNER TO postgres;

--
-- Name: signing_request_step_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_request_step_id_seq OWNED BY public.signing_request_step.id;


--
-- Name: signing_request_step_signer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_request_step_signer (
    id bigint NOT NULL,
    buoc_ky_id bigint NOT NULL,
    nguoi_ky_id bigint NOT NULL,
    chuc_vu_id bigint,
    ten_nguoi_ky character varying(255) NOT NULL,
    ten_chuc_vu character varying(255),
    vai_tro_ky character varying(20) NOT NULL,
    chan_ky_chinh boolean DEFAULT true NOT NULL,
    trang_thai character varying(20) DEFAULT 'CHO_KY'::character varying NOT NULL,
    thoi_diem_mo timestamp with time zone,
    ngay_ky timestamp with time zone,
    ngay_tu_choi timestamp with time zone,
    ly_do_tu_choi text DEFAULT ''::text NOT NULL,
    chu_ky_hien_hanh_id bigint,
    uy_quyen_tu_id bigint,
    ly_do_uy_quyen text DEFAULT ''::text NOT NULL,
    ngay_uy_quyen timestamp with time zone,
    trang_ky integer,
    toa_do_x numeric(10,4),
    toa_do_y numeric(10,4),
    chieu_rong_khung numeric(10,4),
    chieu_cao_khung numeric(10,4),
    khoa_chong_trung_thao_tac character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_signing_signer_ly_do_uy_quyen CHECK (((uy_quyen_tu_id IS NULL) OR (NOT (ly_do_uy_quyen = ''::text)))),
    CONSTRAINT signing_request_step_signer_trang_ky_check CHECK ((trang_ky >= 0))
);


ALTER TABLE public.signing_request_step_signer OWNER TO postgres;

--
-- Name: signing_request_step_signer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_request_step_signer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_request_step_signer_id_seq OWNER TO postgres;

--
-- Name: signing_request_step_signer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_request_step_signer_id_seq OWNED BY public.signing_request_step_signer.id;


--
-- Name: signing_signature; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signing_signature (
    id bigint NOT NULL,
    luot_trinh_id bigint NOT NULL,
    buoc_ky_id bigint NOT NULL,
    khoa_ky_id bigint NOT NULL,
    hash_tai_lieu character varying(64) NOT NULL,
    thuat_toan character varying(50) NOT NULL,
    chu_ky_so text NOT NULL,
    ghi_chu_ky text DEFAULT ''::text NOT NULL,
    ky_tre_han boolean DEFAULT false NOT NULL,
    so_giay_tre integer,
    ngay_ky timestamp with time zone DEFAULT now() NOT NULL,
    trang_thai_xac_minh character varying(20) DEFAULT 'HOP_LE'::character varying NOT NULL,
    thoi_diem_xac_minh timestamp with time zone,
    vi_tri_anh_chu_ky character varying(500) DEFAULT ''::character varying NOT NULL,
    ma_bam_anh_chu_ky character varying(64) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_signing_signature_hash_sha256 CHECK (((hash_tai_lieu)::text ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT signing_signature_so_giay_tre_check CHECK ((so_giay_tre >= 0))
);


ALTER TABLE public.signing_signature OWNER TO postgres;

--
-- Name: signing_signature_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signing_signature_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signing_signature_id_seq OWNER TO postgres;

--
-- Name: signing_signature_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signing_signature_id_seq OWNED BY public.signing_signature.id;


--
-- Name: task_attachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_attachment (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    path character varying(500) NOT NULL,
    cong_viec_id bigint NOT NULL,
    y_kien_id bigint,
    loai public.task_attachment_loai NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nguoi_tao_id bigint NOT NULL,
    CONSTRAINT chk_task_attachment_evidence CHECK ((((loai = 'GIAO_VIEC'::public.task_attachment_loai) AND (y_kien_id IS NULL)) OR ((loai = 'BANG_CHUNG'::public.task_attachment_loai) AND (y_kien_id IS NOT NULL))))
);


ALTER TABLE public.task_attachment OWNER TO postgres;

--
-- Name: task_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_attachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_attachment_id_seq OWNER TO postgres;

--
-- Name: task_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_attachment_id_seq OWNED BY public.task_attachment.id;


--
-- Name: task_comment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_comment (
    id bigint NOT NULL,
    cong_viec bigint NOT NULL,
    nguoi_ghi bigint NOT NULL,
    noi_dung text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.task_comment OWNER TO postgres;

--
-- Name: task_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_comment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_comment_id_seq OWNER TO postgres;

--
-- Name: task_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_comment_id_seq OWNED BY public.task_comment.id;


--
-- Name: task_congviec; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_congviec (
    id bigint NOT NULL,
    noi_dung text NOT NULL,
    ngay_tao_cv date NOT NULL,
    ngay_xu_ly date NOT NULL,
    yeu_cau_xu_ly text NOT NULL,
    nguoi_tao_id bigint NOT NULL,
    document_type public.document_kind,
    document_id bigint,
    hien_thi boolean DEFAULT true NOT NULL,
    opened_at timestamp with time zone,
    opened_by bigint,
    approved_at timestamp with time zone,
    approved_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_task_document CHECK ((((document_type IS NULL) AND (document_id IS NULL)) OR ((document_type IS NOT NULL) AND (document_id IS NOT NULL)))),
    CONSTRAINT chk_task_due_after_created CHECK ((ngay_xu_ly >= ngay_tao_cv))
);


ALTER TABLE public.task_congviec OWNER TO postgres;

--
-- Name: task_congviec_donvi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_congviec_donvi (
    id bigint NOT NULL,
    cong_viec bigint NOT NULL,
    don_vi bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.task_congviec_donvi OWNER TO postgres;

--
-- Name: task_congviec_donvi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_congviec_donvi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_congviec_donvi_id_seq OWNER TO postgres;

--
-- Name: task_congviec_donvi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_congviec_donvi_id_seq OWNED BY public.task_congviec_donvi.id;


--
-- Name: task_congviec_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_congviec_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_congviec_id_seq OWNER TO postgres;

--
-- Name: task_congviec_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_congviec_id_seq OWNED BY public.task_congviec.id;


--
-- Name: task_participant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_participant (
    id bigint NOT NULL,
    cong_viec bigint NOT NULL,
    can_bo bigint NOT NULL,
    vai_tro public.task_vaitro NOT NULL,
    CONSTRAINT chk_task_participant_role CHECK ((vai_tro = ANY (ARRAY['CHU_TRI'::public.task_vaitro, 'CHI_DAO'::public.task_vaitro, 'THAM_GIA'::public.task_vaitro])))
);


ALTER TABLE public.task_participant OWNER TO postgres;

--
-- Name: task_participant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_participant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_participant_id_seq OWNER TO postgres;

--
-- Name: task_participant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_participant_id_seq OWNED BY public.task_participant.id;


--
-- Name: token_blacklist_blacklistedtoken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_blacklist_blacklistedtoken (
    id bigint NOT NULL,
    blacklisted_at timestamp with time zone NOT NULL,
    token_id bigint NOT NULL
);


ALTER TABLE public.token_blacklist_blacklistedtoken OWNER TO postgres;

--
-- Name: token_blacklist_blacklistedtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.token_blacklist_blacklistedtoken ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.token_blacklist_blacklistedtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: token_blacklist_outstandingtoken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_blacklist_outstandingtoken (
    id bigint NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    user_id bigint,
    jti character varying(255) CONSTRAINT token_blacklist_outstandingtoken_jti_hex_not_null NOT NULL
);


ALTER TABLE public.token_blacklist_outstandingtoken OWNER TO postgres;

--
-- Name: token_blacklist_outstandingtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.token_blacklist_outstandingtoken ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.token_blacklist_outstandingtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: work_task; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_task (
    id bigint NOT NULL,
    title text NOT NULL,
    created_date date NOT NULL,
    due_date date NOT NULL,
    requirement text NOT NULL,
    is_public boolean NOT NULL,
    first_opened_at timestamp with time zone,
    approved_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    approved_by_id bigint,
    created_by_id bigint NOT NULL,
    first_opened_by_id bigint,
    CONSTRAINT work_task_due_after_created CHECK ((due_date >= created_date))
);


ALTER TABLE public.work_task OWNER TO postgres;

--
-- Name: work_task_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.work_task ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.work_task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: work_taskattachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_taskattachment (
    id bigint NOT NULL,
    kind character varying(20) NOT NULL,
    file character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    size bigint NOT NULL,
    uploaded_at timestamp with time zone NOT NULL,
    task_id bigint NOT NULL,
    uploaded_by_id bigint NOT NULL,
    comment_id bigint,
    CONSTRAINT work_attachment_evidence_in_comment CHECK ((((comment_id IS NULL) AND ((kind)::text = 'GIAO_VIEC'::text)) OR ((comment_id IS NOT NULL) AND ((kind)::text = 'BANG_CHUNG'::text)))),
    CONSTRAINT work_taskattachment_size_check CHECK ((size >= 0))
);


ALTER TABLE public.work_taskattachment OWNER TO postgres;

--
-- Name: work_taskattachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.work_taskattachment ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.work_taskattachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: work_taskcomment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_taskcomment (
    id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    author_id bigint NOT NULL,
    task_id bigint NOT NULL
);


ALTER TABLE public.work_taskcomment OWNER TO postgres;

--
-- Name: work_taskcomment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.work_taskcomment ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.work_taskcomment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: work_taskparticipant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_taskparticipant (
    id bigint NOT NULL,
    role character varying(20) NOT NULL,
    task_id bigint NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.work_taskparticipant OWNER TO postgres;

--
-- Name: work_taskparticipant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.work_taskparticipant ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.work_taskparticipant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_employee id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee ALTER COLUMN id SET DEFAULT nextval('public.accounts_employee_id_seq'::regclass);


--
-- Name: accounts_employee_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee_groups ALTER COLUMN id SET DEFAULT nextval('public.accounts_employee_groups_id_seq'::regclass);


--
-- Name: accounts_employee_user_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee_user_permissions ALTER COLUMN id SET DEFAULT nextval('public.accounts_employee_user_permissions_id_seq'::regclass);


--
-- Name: accounts_position id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_position ALTER COLUMN id SET DEFAULT nextval('public.accounts_position_id_seq'::regclass);


--
-- Name: auth_group id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group ALTER COLUMN id SET DEFAULT nextval('public.auth_group_id_seq'::regclass);


--
-- Name: auth_group_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions ALTER COLUMN id SET DEFAULT nextval('public.auth_group_permissions_id_seq'::regclass);


--
-- Name: auth_permission id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission ALTER COLUMN id SET DEFAULT nextval('public.auth_permission_id_seq'::regclass);


--
-- Name: birthdays_birthdayemaillog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.birthdays_birthdayemaillog ALTER COLUMN id SET DEFAULT nextval('public.birthdays_birthdayemaillog_id_seq'::regclass);


--
-- Name: birthdays_birthdaywish id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.birthdays_birthdaywish ALTER COLUMN id SET DEFAULT nextval('public.birthdays_birthdaywish_id_seq'::regclass);


--
-- Name: documents_access_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_access_log ALTER COLUMN id SET DEFAULT nextval('public.documents_access_log_id_seq'::regclass);


--
-- Name: documents_vanbanden id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden ALTER COLUMN id SET DEFAULT nextval('public.documents_vanbanden_id_seq'::regclass);


--
-- Name: documents_vanbanden_attachment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_attachment ALTER COLUMN id SET DEFAULT nextval('public.documents_vanbanden_attachment_id_seq'::regclass);


--
-- Name: documents_vanbandi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi ALTER COLUMN id SET DEFAULT nextval('public.documents_vanbandi_id_seq'::regclass);


--
-- Name: documents_vanbandi_attachment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_attachment ALTER COLUMN id SET DEFAULT nextval('public.documents_vanbandi_attachment_id_seq'::regclass);


--
-- Name: documents_view_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_view_log ALTER COLUMN id SET DEFAULT nextval('public.documents_view_log_id_seq'::regclass);


--
-- Name: meetings_meetingbooking id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings_meetingbooking ALTER COLUMN id SET DEFAULT nextval('public.meetings_meetingbooking_id_seq'::regclass);


--
-- Name: meetings_meetingroom id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings_meetingroom ALTER COLUMN id SET DEFAULT nextval('public.meetings_meetingroom_id_seq'::regclass);


--
-- Name: organizations_donvi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations_donvi ALTER COLUMN id SET DEFAULT nextval('public.organizations_donvi_id_seq'::regclass);


--
-- Name: organizations_khoi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations_khoi ALTER COLUMN id SET DEFAULT nextval('public.organizations_khoi_id_seq'::regclass);


--
-- Name: records_chitiettailieu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu ALTER COLUMN id SET DEFAULT nextval('public.records_chitiettailieu_id_seq'::regclass);


--
-- Name: records_chitiettailieu_attachment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu_attachment ALTER COLUMN id SET DEFAULT nextval('public.records_chitiettailieu_attachment_id_seq'::regclass);


--
-- Name: records_hoso id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_hoso ALTER COLUMN id SET DEFAULT nextval('public.records_hoso_id_seq'::regclass);


--
-- Name: records_loaitailieu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_loaitailieu ALTER COLUMN id SET DEFAULT nextval('public.records_loaitailieu_id_seq'::regclass);


--
-- Name: records_loaivanban id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_loaivanban ALTER COLUMN id SET DEFAULT nextval('public.records_loaivanban_id_seq'::regclass);


--
-- Name: records_tailieu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_tailieu ALTER COLUMN id SET DEFAULT nextval('public.records_tailieu_id_seq'::regclass);


--
-- Name: signing_attempt id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_attempt ALTER COLUMN id SET DEFAULT nextval('public.signing_attempt_id_seq'::regclass);


--
-- Name: signing_audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_audit_log ALTER COLUMN id SET DEFAULT nextval('public.signing_audit_log_id_seq'::regclass);


--
-- Name: signing_change_message id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_change_message ALTER COLUMN id SET DEFAULT nextval('public.signing_change_message_id_seq'::regclass);


--
-- Name: signing_change_thread id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_change_thread ALTER COLUMN id SET DEFAULT nextval('public.signing_change_thread_id_seq'::regclass);


--
-- Name: signing_key id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_key ALTER COLUMN id SET DEFAULT nextval('public.signing_key_id_seq'::regclass);


--
-- Name: signing_key_unlock id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_key_unlock ALTER COLUMN id SET DEFAULT nextval('public.signing_key_unlock_id_seq'::regclass);


--
-- Name: signing_manifest id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_manifest ALTER COLUMN id SET DEFAULT nextval('public.signing_manifest_id_seq'::regclass);


--
-- Name: signing_notification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_notification ALTER COLUMN id SET DEFAULT nextval('public.signing_notification_id_seq'::regclass);


--
-- Name: signing_process id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process ALTER COLUMN id SET DEFAULT nextval('public.signing_process_id_seq'::regclass);


--
-- Name: signing_process_step id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process_step ALTER COLUMN id SET DEFAULT nextval('public.signing_process_step_id_seq'::regclass);


--
-- Name: signing_process_step_signer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process_step_signer ALTER COLUMN id SET DEFAULT nextval('public.signing_process_step_signer_id_seq'::regclass);


--
-- Name: signing_request id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request ALTER COLUMN id SET DEFAULT nextval('public.signing_request_id_seq'::regclass);


--
-- Name: signing_request_step id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step ALTER COLUMN id SET DEFAULT nextval('public.signing_request_step_id_seq'::regclass);


--
-- Name: signing_request_step_signer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step_signer ALTER COLUMN id SET DEFAULT nextval('public.signing_request_step_signer_id_seq'::regclass);


--
-- Name: signing_signature id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_signature ALTER COLUMN id SET DEFAULT nextval('public.signing_signature_id_seq'::regclass);


--
-- Name: task_attachment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachment ALTER COLUMN id SET DEFAULT nextval('public.task_attachment_id_seq'::regclass);


--
-- Name: task_comment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comment ALTER COLUMN id SET DEFAULT nextval('public.task_comment_id_seq'::regclass);


--
-- Name: task_congviec id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_congviec ALTER COLUMN id SET DEFAULT nextval('public.task_congviec_id_seq'::regclass);


--
-- Name: task_congviec_donvi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_congviec_donvi ALTER COLUMN id SET DEFAULT nextval('public.task_congviec_donvi_id_seq'::regclass);


--
-- Name: task_participant id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_participant ALTER COLUMN id SET DEFAULT nextval('public.task_participant_id_seq'::regclass);


--
-- Data for Name: accounts_employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts_employee (id, ho_ten, ngay_sinh, chuc_vu_id, chuc_danh, email, sdt, don_vi_id, username, password, is_active, is_staff, is_superuser, is_public, trang_thai, ghi_chu, last_login, created_at, updated_at) FROM stdin;
2	Trưởng Phòng CNTT	1990-01-01	2		truongphong_cntt@baolong.vn	0901111222	6	truongphong_cntt	pbkdf2_sha256$1500000$phlgZugfhMEtNQlwRJO7y6$y9VVI3HQXcALuMbNj9AGuBAwQCbFx7ps3CnSK/HjFJE=	t	f	f	t	LAM_VIEC		\N	2026-10-10 14:38:44.700714+07	2026-10-10 14:38:44.700714+07
3	Chuyên Viên CNTT	1990-01-01	4		chuyenvien_cntt@baolong.vn	0902222333	6	chuyenvien_cntt	pbkdf2_sha256$1500000$Va0QBNDXWj9XeD3P7OdyeS$sCPgQEjBRroG8+9azmLCv4H+qr02T6MI/0+k0bCg1Sk=	t	f	f	t	LAM_VIEC		\N	2026-10-10 14:38:45.37862+07	2026-10-10 14:38:45.37862+07
4	Văn Thư Lưu Trữ	1990-01-01	6		vanthu_cntt@baolong.vn	0903333444	6	vanthu_cntt	pbkdf2_sha256$1500000$hBodxWdrlpPKxWtPiQYYLl$F5iDxl2k8J1HfddmgSKjTRqHrS/7uWVpNYqGfHMEcpY=	t	f	f	t	LAM_VIEC		\N	2026-10-10 14:38:45.995141+07	2026-10-10 14:38:45.995141+07
5	Phan Quốc Dũng	1990-01-01	1		phanquocdung@baolong.vn		1	phanquocdung	pbkdf2_sha256$1500000$QQlHqFsL0CIO9Q55BlSOnP$vMG4QIo5/A1tToKd4lFVXDLuGwvr/EsP73/mKRbyb+E=	t	f	f	t	LAM_VIEC		\N	2026-10-15 07:03:45.959246+07	2026-10-15 07:03:45.959246+07
14	Nguyễn Văn An	1990-01-01	1		\N		1	demo_nguoi_trinh_1	!1n5M6qLWCkHnq6eZjyit41EvVfb5kV71VOx7GVEy	t	f	f	t	LAM_VIEC		\N	2026-10-23 19:25:51.425482+07	2026-10-23 19:25:51.425482+07
15	Trần Thị Bình	1990-01-01	1		\N		1	demo_nguoi_trinh_2	!gZpoUhGbkIquTirTpBRFyACqm3TScJp9wl8TucaN	t	f	f	t	LAM_VIEC		\N	2026-10-23 19:25:51.431195+07	2026-10-23 19:25:51.431195+07
1	Quản trị hệ thống	1990-01-01	1	\N	admin@baolong.vn	0901234567	6	admin	pbkdf2_sha256$1500000$yk6UlMtjmpgrkHZRxFpLKU$zAnVZHfcPHSsyBMKtB47lFxn8atEDZ962n/+2dBRiDE=	t	t	t	t	LAM_VIEC	\N	\N	2026-10-10 13:23:40.927625+07	2026-10-24 09:58:21.81418+07
6	Văn Thư	1990-01-01	6		vanthu@baolong.vn		6	vanthu	pbkdf2_sha256$1500000$qSWctcQPEJGGOiVYwISitB$FXGijomEMfVuIa9u6v+o2JBHLvY4OCv6dA8wttQSMXg=	t	f	f	t	LAM_VIEC		\N	2026-10-22 08:23:20.861615+07	2026-10-24 09:58:21.81418+07
7	Chuyên Viên	1990-01-01	4		chuyenvien@baolong.vn		6	chuyenvien	pbkdf2_sha256$1500000$D6G9VzFVkbnqqOriPh78md$dKbTsxZdHYnlA7b5MTLGJ4DyxmGyb0N/7vLp74mTMZo=	t	f	f	t	LAM_VIEC		\N	2026-10-22 08:23:21.549795+07	2026-10-24 09:58:21.81418+07
8	Trưởng Phòng	1990-01-01	2		truongphong@baolong.vn		6	truongphong	pbkdf2_sha256$1500000$yU1VqdlbGskwymEj7qdkGV$rpAAYMyWyQ9xu7Pfhr+3WO55T7b8/YSLNX7c/VT2OY8=	t	f	f	t	LAM_VIEC		\N	2026-10-22 08:23:22.201587+07	2026-10-24 09:58:21.81418+07
9	Giám Đốc	1990-01-01	7		giamdoc@baolong.vn		6	giamdoc	pbkdf2_sha256$1500000$TIJvVLpF6RIZAtCPq9tSGD$lns1FKHR6K1ya6XNwZ6/61Xkn6dC7DwlMGJ2ey0UPs4=	t	f	f	t	LAM_VIEC		\N	2026-10-22 08:23:22.87521+07	2026-10-24 09:58:21.81418+07
\.


--
-- Data for Name: accounts_employee_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts_employee_groups (id, employee_id, group_id) FROM stdin;
1	1	5
2	6	1
3	7	2
4	8	3
5	9	4
\.


--
-- Data for Name: accounts_employee_user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts_employee_user_permissions (id, employee_id, permission_id) FROM stdin;
\.


--
-- Data for Name: accounts_position; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts_position (id, display_order, name, is_public, note) FROM stdin;
1	1	Quản trị viên	t	\N
2	2	Trưởng phòng	t	
3	3	Phó phòng	t	
4	4	Chuyên viên	t	
5	5	Nhân viên	t	
6	6	Văn thư	t	
7	7	Lãnh đạo cơ quan	t	
\.


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group (id, name, ma_nhom_quyen) FROM stdin;
1	Văn thư	VT
2	Chuyên viên	CV
3	Trưởng phòng	TP
4	Ban Giám đốc	BGD
5	Quản trị hệ thống	ADMIN
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
1	5	1
2	5	2
3	5	3
4	5	4
5	5	5
6	5	6
7	5	7
8	5	8
9	5	9
10	5	10
11	5	11
12	5	12
13	5	13
14	5	14
15	5	15
16	5	16
17	5	17
18	5	18
19	5	19
20	5	20
21	5	21
22	5	22
23	5	23
24	5	24
25	5	25
26	5	26
27	5	27
28	5	28
29	5	29
30	5	30
31	5	31
32	5	32
33	5	33
34	5	34
35	5	35
36	5	36
37	5	37
38	5	38
39	5	39
40	5	40
41	5	41
42	5	42
43	5	43
44	5	44
45	5	45
46	5	46
47	5	47
48	5	48
49	5	49
50	5	50
51	5	51
52	5	52
53	5	53
54	5	54
55	5	55
56	5	56
57	5	57
58	5	58
59	5	59
60	5	60
61	5	61
62	5	62
63	5	63
64	5	64
65	5	65
66	5	66
67	5	67
68	5	68
69	5	69
70	5	70
71	5	71
72	5	72
73	5	73
74	5	74
75	5	75
76	5	76
77	5	77
78	4	1
79	4	6
80	4	10
81	4	15
82	4	18
83	4	22
84	4	28
85	4	30
86	4	36
87	4	38
88	4	44
89	4	48
90	4	49
91	4	50
92	4	52
93	4	53
94	4	54
95	4	55
96	4	56
97	4	57
98	4	58
99	4	59
100	4	62
101	4	63
102	4	64
103	4	65
104	4	67
105	4	68
106	4	77
107	3	1
108	3	6
109	3	10
110	3	15
111	3	18
112	3	22
113	3	28
114	3	30
115	3	38
116	3	44
117	3	48
118	3	49
119	3	50
120	3	51
121	3	52
122	3	53
123	3	54
124	3	56
125	3	58
126	3	59
127	3	60
128	3	62
129	3	63
130	3	64
131	3	65
132	3	67
133	3	68
134	3	77
135	2	1
136	2	6
137	2	10
138	2	15
139	2	18
140	2	22
141	2	30
142	2	38
143	2	44
144	2	48
145	2	49
146	2	56
147	2	58
148	2	59
149	2	60
150	2	63
151	2	64
152	2	65
153	2	67
154	2	68
155	2	77
156	1	1
157	1	6
158	1	10
159	1	15
160	1	18
161	1	22
162	1	23
163	1	24
164	1	25
165	1	26
166	1	27
167	1	28
168	1	29
169	1	30
170	1	31
171	1	32
172	1	33
173	1	34
174	1	35
175	1	36
176	1	37
177	1	38
178	1	39
179	1	40
180	1	42
181	1	43
182	1	44
183	1	45
184	1	46
185	1	48
186	1	49
187	1	52
188	1	56
189	1	58
190	1	59
191	1	60
192	1	63
193	1	64
194	1	65
195	1	67
196	1	68
197	1	77
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_permission (id, name, content_type_id, codename, module_ten) FROM stdin;
1	Xem danh sách đơn vị/phòng ban	\N	view_donvi	Đơn vị, phòng ban
2	Thêm đơn vị/phòng ban	\N	add_donvi	Đơn vị, phòng ban
3	Sửa đơn vị/phòng ban	\N	change_donvi	Đơn vị, phòng ban
4	Xóa đơn vị/phòng ban	\N	delete_donvi	Đơn vị, phòng ban
5	Xuất Excel đơn vị/phòng ban	\N	export_donvi	Đơn vị, phòng ban
6	Xem danh sách chức vụ	\N	view_chucvu	Chức vụ
7	Thêm chức vụ	\N	add_chucvu	Chức vụ
8	Sửa chức vụ	\N	change_chucvu	Chức vụ
9	Xóa chức vụ	\N	delete_chucvu	Chức vụ
10	Xem danh sách loại tài liệu	\N	view_loaitailieubieumau	Loại tài liệu biểu mẫu
11	Thêm loại tài liệu	\N	add_loaitailieubieumau	Loại tài liệu biểu mẫu
12	Sửa loại tài liệu	\N	change_loaitailieubieumau	Loại tài liệu biểu mẫu
13	Xóa loại tài liệu	\N	delete_loaitailieubieumau	Loại tài liệu biểu mẫu
14	Xem toàn bộ thông tin CBNV (kể cả năm sinh, Nhóm quyền, mật khẩu)	\N	view_full_cbnv	CBNV
15	Xem danh sách CBNV (ẩn field nhạy cảm)	\N	view_list_cbnv	CBNV
16	Thêm CBNV	\N	add_cbnv	CBNV
17	Sửa CBNV (đầy đủ field)	\N	change_full_cbnv	CBNV
18	Sửa thông tin cá nhân của chính mình	\N	change_self_cbnv	CBNV
19	Xóa CBNV	\N	delete_cbnv	CBNV
20	Duyệt yêu cầu đổi mật khẩu	\N	approve_password_reset_cbnv	CBNV
21	Import file CBNV	\N	import_cbnv	CBNV
22	Xem danh sách/chi tiết văn bản đến	\N	view_vanbanden	Văn bản đến
23	Thêm văn bản đến	\N	add_vanbanden	Văn bản đến
24	Sửa văn bản đến	\N	change_vanbanden	Văn bản đến
25	Xóa văn bản đến	\N	delete_vanbanden	Văn bản đến
26	Import file văn bản đến	\N	import_vanbanden	Văn bản đến
27	Xuất Excel văn bản đến	\N	export_vanbanden	Văn bản đến
28	Xem log user đã xem văn bản đến	\N	view_read_log_vanbanden	Văn bản đến
29	Gửi mail toàn hệ thống (văn bản đến)	\N	send_mail_all_vanbanden	Văn bản đến
30	Xem danh sách/chi tiết văn bản đi	\N	view_vanbandi	Văn bản đi
31	Thêm văn bản đi	\N	add_vanbandi	Văn bản đi
32	Sửa văn bản đi	\N	change_vanbandi	Văn bản đi
33	Xóa văn bản đi	\N	delete_vanbandi	Văn bản đi
34	Import file văn bản đi	\N	import_vanbandi	Văn bản đi
35	Xuất Excel văn bản đi	\N	export_vanbandi	Văn bản đi
36	Xem log user đã xem văn bản đi	\N	view_read_log_vanbandi	Văn bản đi
37	Gửi mail toàn hệ thống (văn bản đi)	\N	send_mail_all_vanbandi	Văn bản đi
38	Xem danh mục hồ sơ	\N	view_hoso	Hồ sơ
39	Lập/Thêm hồ sơ	\N	add_hoso	Hồ sơ
40	Sửa hồ sơ	\N	change_hoso	Hồ sơ
41	Xóa hồ sơ	\N	delete_hoso	Hồ sơ
42	Mở/Đóng danh mục hồ sơ	\N	toggle_status_hoso	Hồ sơ
43	Đưa văn bản vào / loại ra khỏi hồ sơ điện tử	\N	manage_documents_hoso	Hồ sơ
44	Xem tài liệu, biểu mẫu	\N	view_tailieu	Tài liệu, biểu mẫu
45	Thêm tài liệu, biểu mẫu	\N	add_tailieu	Tài liệu, biểu mẫu
46	Sửa tài liệu, biểu mẫu	\N	change_tailieu	Tài liệu, biểu mẫu
47	Xóa tài liệu, biểu mẫu	\N	delete_tailieu	Tài liệu, biểu mẫu
48	Xem văn bản trình ký	\N	view_trinhky	Trình ký
49	Tạo trình ký	\N	add_trinhky	Trình ký
50	Ký (đúng lượt trong sơ đồ)	\N	sign_trinhky	Trình ký
51	Quản lý quy trình trình ký	\N	manage_signing_process	Trình ký
52	Gửi trình ký / Nộp lại lượt trình	\N	send_trinhky	Trình ký
53	Ủy quyền ký số	\N	delegate_trinhky	Trình ký
54	Hủy yêu cầu trình ký	\N	cancel_trinhky	Trình ký
55	Xem nhật ký kiểm toán trình ký	\N	view_signing_audit	Trình ký
56	Xem công việc (chung)	\N	view_congviec	Công việc
57	Xem tất cả công việc (toàn hệ thống)	\N	view_all_congviec	Công việc
58	Xem công việc theo phòng ban	\N	view_dept_congviec	Công việc
59	Thêm/Giao việc	\N	add_congviec	Công việc
60	Sửa công việc	\N	change_congviec	Công việc
61	Xóa công việc	\N	delete_congviec	Công việc
62	Duyệt / Hủy duyệt công việc	\N	approve_congviec	Công việc
63	Xem lịch phòng họp	\N	view_schedule_phonghop	Phòng họp (danh mục)
64	Đặt phòng họp	\N	add_datphonghop	Đặt phòng họp
65	Sửa/Hủy lịch do chính mình đặt	\N	change_own_datphonghop	Đặt phòng họp
66	Sửa/Hủy mọi lịch đặt phòng (QT)	\N	change_any_datphonghop	Đặt phòng họp
67	Xem danh sách sinh nhật	\N	view_sinhnhat	Sinh nhật
68	Gửi lời chúc (thủ công)	\N	send_wish_sinhnhat	Sinh nhật
69	Xem danh sách nhóm quyền	\N	view_nhomquyen	Phân quyền
70	Thêm nhóm quyền	\N	add_nhomquyen	Phân quyền
71	Sửa nhóm quyền	\N	change_nhomquyen	Phân quyền
72	Xóa nhóm quyền	\N	delete_nhomquyen	Phân quyền
73	Import chức vụ từ Excel	\N	import_chucvu	Chức vụ
74	Thêm phòng họp (danh mục)	\N	add_phonghop	Phòng họp (danh mục)
75	Sửa phòng họp (danh mục)	\N	change_phonghop	Phòng họp (danh mục)
76	Xóa phòng họp (danh mục)	\N	delete_phonghop	Phòng họp (danh mục)
77	Sử dụng chatbot (chỉ trả lời nội dung người hỏi có quyền Xem)	\N	use_aiassistant	Chatbox AI
\.


--
-- Data for Name: birthdays_birthdayemaillog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.birthdays_birthdayemaillog (id, employee_id, sent_date, sent_at, recipient_email, subject, card_template, trang_thai, error_message, retry_count, next_retry_at, smtp_response_code, opened_at, clicked_count, email_provider, updated_at) FROM stdin;
\.


--
-- Data for Name: birthdays_birthdaywish; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.birthdays_birthdaywish (id, employee_id, sender_name, message, card_template, is_anonymous, trang_thai, sticker_url, likes_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_content_type (id, name, app_label, model) FROM stdin;
2		auth	group
3		auth	permission
4		contenttypes	contenttype
5		token_blacklist	blacklistedtoken
6		token_blacklist	outstandingtoken
7		accounts	employee
8		accounts	position
9		work	task
10		work	taskattachment
11		work	taskcomment
12		work	taskdonvi
13		work	taskparticipant
14		organizations	donvi
15		organizations	khoikhuvuc
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	organizations	0001_initial	2026-10-15 07:08:35.860797+07
2	organizations	0002_alter_khoikhuvuc_options_khoikhuvuc_thu_tu_hien_thi_and_more	2026-10-15 07:08:35.876301+07
3	organizations	0003_remove_donvi_created_at_remove_donvi_updated_at_and_more	2026-10-15 07:08:35.876873+07
4	contenttypes	0001_initial	2026-10-15 07:08:44.317788+07
5	contenttypes	0002_remove_content_type_name	2026-10-15 07:08:44.335244+07
6	auth	0001_initial	2026-10-15 07:08:44.339131+07
7	auth	0002_alter_permission_name_max_length	2026-10-15 07:08:44.339679+07
8	auth	0003_alter_user_email_max_length	2026-10-15 07:08:44.340207+07
9	auth	0004_alter_user_username_opts	2026-10-15 07:08:44.340731+07
10	auth	0005_alter_user_last_login_null	2026-10-15 07:08:44.341263+07
11	auth	0006_require_contenttypes_0002	2026-10-15 07:08:44.341825+07
12	auth	0007_alter_validators_add_error_messages	2026-10-15 07:08:44.342342+07
13	auth	0008_alter_user_username_max_length	2026-10-15 07:08:44.342863+07
14	auth	0009_alter_user_last_name_max_length	2026-10-15 07:08:44.343514+07
15	auth	0010_alter_group_name_max_length	2026-10-15 07:08:44.344048+07
16	auth	0011_update_proxy_permissions	2026-10-15 07:08:44.344048+07
17	auth	0012_alter_user_first_name_max_length	2026-10-15 07:08:44.344574+07
18	accounts	0001_initial	2026-10-15 07:08:44.345097+07
19	accounts	0002_position_import_permission	2026-10-15 07:08:44.345615+07
20	token_blacklist	0001_initial	2026-10-15 07:08:54.263943+07
21	token_blacklist	0002_outstandingtoken_jti_hex	2026-10-15 07:08:54.275467+07
22	token_blacklist	0003_auto_20171017_2007	2026-10-15 07:08:54.28687+07
23	token_blacklist	0004_auto_20171017_2013	2026-10-15 07:08:54.291296+07
24	token_blacklist	0005_remove_outstandingtoken_jti	2026-10-15 07:08:54.306286+07
25	token_blacklist	0006_auto_20171017_2113	2026-10-15 07:08:54.313234+07
26	token_blacklist	0007_auto_20171017_2214	2026-10-15 07:08:54.353673+07
27	token_blacklist	0008_migrate_to_bigautofield	2026-10-15 07:08:54.391396+07
28	token_blacklist	0010_fix_migrate_to_bigautofield	2026-10-15 07:08:54.407031+07
29	token_blacklist	0011_linearizes_history	2026-10-15 07:08:54.408137+07
30	token_blacklist	0012_alter_outstandingtoken_user	2026-10-15 07:08:54.413819+07
31	token_blacklist	0013_alter_blacklistedtoken_options_and_more	2026-10-15 07:08:54.421273+07
32	work	0001_initial	2026-10-23 19:23:11.247015+07
33	work	0002_taskattachment_comment_and_more	2026-10-23 19:23:11.266158+07
34	work	0003_taskdonvi_alter_task_options_and_more	2026-10-24 09:55:45.460886+07
35	work	0004_alter_task_options_and_more	2026-10-24 09:55:45.474724+07
36	work	0005_taskdonvi_don_vi_fk	2026-10-24 09:55:45.477075+07
37	work	0006_align_ddl_enums_triggers	2026-10-24 09:55:45.478141+07
38	work	0007_align_defaults_fks_check	2026-10-24 09:55:45.478141+07
39	work	0008_tep_dinh_kem_kho_dung_chung	2026-10-24 09:55:45.478934+07
40	records	0001_initial	2026-10-24 09:57:49.333609+07
41	records	0002_hoso_guards	2026-10-24 09:57:49.349699+07
42	organizations	0004_align_release_ddl	2026-10-24 09:57:49.350795+07
43	organizations	0005_reference_data_ddl	2026-10-24 09:57:49.351358+07
44	accounts	0003_alter_employee_sdt	2026-10-24 09:57:49.351883+07
45	accounts	0004_align_release_ddl	2026-10-24 09:57:49.352414+07
46	accounts	0005_align_release_ddl	2026-10-24 09:57:49.352942+07
47	accounts	0006_reference_data_ddl	2026-10-24 09:57:49.354056+07
48	records	0003_reference_data_ddl	2026-10-24 09:57:49.354568+07
49	documents	0001_initial	2026-10-24 09:57:49.355131+07
50	documents	0002_documentaccesslog_vanbanden_pham_vi_vanbandi_pham_vi_and_more	2026-10-24 09:57:49.355673+07
51	documents	0003_alter_vanbanden_nguoi_tao_and_more	2026-10-24 09:57:49.355673+07
52	documents	0004_vanbandendanhmuc_vanbandendonvinhan_vanbandenhoso_and_more	2026-10-24 09:57:49.356261+07
53	documents	0005_alter_vanbandendanhmuc_unique_together_and_more	2026-10-24 09:57:49.356842+07
54	documents	0006_folder_folderfile_folder_idx_folder_parent_and_more	2026-10-24 09:57:49.356842+07
55	documents	0007_folder_is_local_folder_local_path_and_more	2026-10-24 09:57:49.357414+07
56	accounts	0007_normalize_system_account_password	2026-10-24 09:57:49.357944+07
57	documents	0008_ddl_integrity	2026-10-24 09:57:49.358487+07
58	document_templates	0001_initial	2026-10-24 09:57:49.358487+07
59	document_templates	0002_normalize_column_names_ddl_pr96	2026-10-24 09:57:49.359014+07
60	document_templates	0003_ddl_integrity	2026-10-24 09:57:49.359525+07
61	documents	0009_schema_scalars	2026-10-24 09:57:49.359525+07
62	accounts	0008_install_employee_updated_at_trigger	2026-10-24 09:57:49.360053+07
63	accounts	0009_standard_positions	2026-10-24 09:57:49.360672+07
64	admin	0001_initial	2026-10-24 09:57:49.361108+07
65	admin	0002_logentry_remove_auto_add	2026-10-24 09:57:49.361607+07
66	admin	0003_logentry_add_action_flag_choices	2026-10-24 09:57:49.362113+07
67	authorization	0001_initial	2026-10-24 09:57:49.362113+07
68	authorization	0002_rbac_standard_data	2026-10-24 09:57:49.362639+07
69	authorization	0003_remove_vanbanmat_permissions	2026-10-24 09:57:49.363163+07
70	authorization	0004_grant_tp_manage_signing_process	2026-10-24 09:57:49.363163+07
71	authorization	0005_align_rbac_structure_with_ddl	2026-10-24 09:57:49.363684+07
72	authorization	0006_align_permission_defaults_and_labels	2026-10-24 09:57:49.363684+07
73	authorization	0007_grant_cv_send_trinhky	2026-10-24 09:57:49.363684+07
74	birthdays	0001_initial_birthdays_sql_fix4	2026-10-24 09:57:49.364688+07
75	birthdays	0002_align_release_ddl	2026-10-24 09:57:49.364688+07
76	birthdays	0003_employee_fk_cascade_ddl	2026-10-24 09:57:49.36569+07
77	birthdays	0004_install_updated_at_triggers	2026-10-24 09:57:49.36569+07
78	dashboard	0001_initial	2026-10-24 09:57:49.36569+07
79	dashboard	0002_delete_dashboard_models	2026-10-24 09:57:49.370229+07
80	document_templates	0004_schema_scalars	2026-10-24 09:57:49.370229+07
81	document_templates	0005_attachment_file_size_check	2026-10-24 09:57:49.37122+07
82	documents	0010_ai_metadata_views	2026-10-24 09:57:49.37122+07
83	documents	0011_reconcile_scalar_checks	2026-10-24 09:57:49.375804+07
84	documents	0012_tep_dinh_kem_kho_dung_chung	2026-10-24 09:57:49.375804+07
85	meetings	0001_initial	2026-10-24 09:57:49.376308+07
86	meetings	0002_align_release_ddl	2026-10-24 09:57:49.377698+07
87	meetings	0003_department_fk_set_null_ddl	2026-10-24 09:57:49.378311+07
88	meetings	0004_install_meetingroom_updated_at_trigger	2026-10-24 09:57:49.378836+07
89	sessions	0001_initial	2026-10-24 09:57:49.379348+07
90	signing	0001_khoi_tao_khoa_va_quy_trinh	2026-10-24 09:57:49.379348+07
91	signing	0002_khoi_tao_luong_trinh_ky	2026-10-24 09:57:49.379874+07
92	signing	0003_mo_khoa_ky_bang_pin	2026-10-24 09:57:49.3804+07
93	signing	0004_bo_vanbanmat	2026-10-24 09:57:49.3804+07
94	signing	0005_bo_kieu_ky_chi_nhan_van_ban_di	2026-10-24 09:57:49.380925+07
95	signing	0006_ho_so_goc_pham_vi_chuc_vu_muc_do	2026-10-24 09:57:49.381974+07
96	signing	0007_tep_hoan_tat	2026-10-24 09:57:49.382492+07
97	signing	0008_don_vi_ap_dung	2026-10-24 09:57:49.383014+07
98	signing	0009_doi_ten_cot_theo_ddl_chuan_hoa	2026-10-24 09:57:49.383014+07
99	signing	0010_khoa_ngoai_don_vi_chuc_vu	2026-10-24 09:57:49.383536+07
100	signing	0011_restore_signing_database_guards	2026-10-24 09:57:49.384239+07
101	signing	0012_db_defaults_document_kind	2026-10-24 09:57:49.384771+07
102	signing	0013_nhan_loai_van_ban	2026-10-24 09:57:49.384771+07
103	signing	0014_bo_muc_do	2026-10-24 09:57:49.385294+07
\.


--
-- Data for Name: documents_access_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_access_log (id, document_type, document_id, user_id, hanh_dong, doi_tuong_user_id, tep_id, dia_chi_ip, created_at) FROM stdin;
\.


--
-- Data for Name: documents_vanbanden; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbanden (id, nam, so_hieu, so_thu_tu, ngay_den, trich_yeu, noi_ban_hanh, ngay_van_ban, nguoi_ky, chuc_vu, hieu_luc, ngay_het_hieu_luc, link_thay_the, ghi_chu, hien_thi, gui_mail_toan_he_thong, pham_vi, nguoi_tao_id, created_at, updated_at) FROM stdin;
1	2026	45/CV-BGDĐT	1	2026-10-23 08:30:00+07	V/v hướng dẫn thực hiện công tác kiểm định chất lượng đào tạo và chuẩn đầu ra năm học 2026 - 2027	Bộ Giáo dục và Đào tạo	2026-10-23 08:30:00+07	Nguyễn Anh Đô	Đại diện tiếp nhận	CON_HIEU_LUC	\N	\N	\N	t	f	NOI_BO	1	2026-10-10 14:14:56.402369+07	2026-10-23 21:33:06.46459+07
2	2026	118/TB-UBND	2	2026-10-22 09:15:00+07	Thông báo kế hoạch phát động Tháng hành động vì an toàn thông tin và chuyển đổi số trường học năm 2026	UBND TP.Hồ Chí Minh	2026-10-22 09:15:00+07	Châu Tuấn Kiệt	Trưởng nhóm 1 - PM	CON_HIEU_LUC	\N	\N	\N	t	f	NOI_BO	1	2026-10-10 14:14:56.402369+07	2026-10-23 21:33:06.46459+07
3	2026	89/CV-STTTT	3	2026-10-21 14:00:00+07	V/v rà soát, kiểm tra phương án bảo đảm an toàn hệ thống thông tin phục vụ xét tuyển trực tuyến	Sở Thông tin và Truyền thông	2026-10-21 14:00:00+07	Nguyễn Tấn Lộc Khiêm	Nhóm 2 - Quản lý VB	CON_HIEU_LUC	\N	\N	\N	t	f	NOI_BO	1	2026-10-10 14:14:56.402369+07	2026-10-23 21:33:06.46459+07
4	2026	26/HD-SGDĐT	4	2026-10-20 10:30:00+07	Hướng dẫn tổ chức Ngày hội tư vấn hướng nghiệp và phân luồng học sinh sau THPT năm 2026	Sở Giáo dục và Đào tạo TP.HCM	2026-10-20 10:30:00+07	Phan Tạ Hữu Đức	Trưởng nhóm 6 - Công việc	CON_HIEU_LUC	\N	\N	\N	t	f	NOI_BO	1	2026-10-10 14:14:56.402369+07	2026-10-23 21:33:06.46459+07
5	2026	05/TB-TTr-BGD	5	2026-10-18 15:45:00+07	Thông báo kết luận thanh tra công tác quản lý tài chính và cơ sở vật chất CNTT	Thanh tra Bộ GD&ĐT	2026-10-18 15:45:00+07	Trần Nhật Tân	Nhóm 2 - Quản lý VB	CON_HIEU_LUC	\N	\N	\N	t	f	NOI_BO	1	2026-10-10 14:14:56.402369+07	2026-10-23 21:33:06.46459+07
18	2026	215/CV-TCGDNN	6	2026-09-15 08:00:00+07	Triển khai chỉ tiêu tuyển sinh đào tạo hệ Cao đẳng chính quy nghề trọng điểm quốc gia năm 2026	Tổng cục Giáo dục Nghề nghiệp	2026-09-15 08:00:00+07	Lê Thanh Hậu	Trưởng nhóm 5 - Trình ký	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 21:33:06.50479+07	2026-10-23 21:33:06.50479+07
19	2026	78/TB-SLĐTBXH	7	2026-08-28 13:30:00+07	Kế hoạch tổ chức Hội thi kỹ năng nghề cấp Thành phố dành cho học sinh, sinh viên năm 2026	Sở Lao động - Thương binh & Xã hội	2026-08-28 13:30:00+07	Thượng Mạnh Quỳnh	Trưởng nhóm 4 - Tài liệu	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 21:33:06.50479+07	2026-10-23 21:33:06.50479+07
20	2026	34/CV-CATP	8	2026-07-12 09:00:00+07	V/v phối hợp bảo đảm an ninh trật tự và phòng cháy chữa cháy khu vực ký túc xá sinh viên	Công an TP.Hồ Chí Minh	2026-07-12 09:00:00+07	Tô Thanh Tân	Trưởng nhóm 7 - Hệ thống	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 21:33:06.5218+07	2026-10-23 21:33:06.5218+07
21	2026	19/HD-LĐLĐ	9	2026-06-05 16:00:00+07	Hướng dẫn tổ chức các hoạt động văn hóa thể thao chào mừng ngày Nhà giáo Việt Nam 20/11	Liên đoàn Lao động TP.HCM	2026-06-05 16:00:00+07	Đặng Trường Thịnh	Trưởng nhóm 3 - Hồ sơ	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 21:33:06.5218+07	2026-10-23 21:33:06.5218+07
22	2026	12/CV-BYT	10	2026-04-14 11:00:00+07	Khuyến cáo tăng cường vệ sinh phòng dịch bệnh theo mùa trong môi trường trường học	Trung tâm Kiểm soát Bệnh tật (HCDC)	2026-04-14 11:00:00+07	Trần Vũ Giang Anh	Trưởng nhóm 8 - AI Chat	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 21:33:06.5218+07	2026-10-23 21:33:06.5218+07
23	2026	67/TB-BGDĐT	11	2026-03-02 14:30:00+07	Thông báo danh mục đề tài NCKH ứng dụng công nghệ AI được duyệt kinh phí năm 2026	Bộ Giáo dục và Đào tạo	2026-03-02 14:30:00+07	Trần Vũ Giang Anh	Trưởng nhóm 8 - AI Chat	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 21:33:06.5218+07	2026-10-23 21:33:06.5218+07
24	2026	03/CV-BHXH	12	2026-01-15 09:30:00+07	Đôn đốc rà soát, đồng bộ thẻ Bảo hiểm y tế điện tử (VssID) cho sinh viên khóa mới	Bảo hiểm Xã hội TP.HCM	2026-01-15 09:30:00+07	Nguyễn Anh Đô	Nhóm 2 - Quản lý VB	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 21:33:06.538425+07	2026-10-23 21:33:06.538425+07
\.


--
-- Data for Name: documents_vanbanden_attachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbanden_attachment (id, document_id, name, path, is_deleted, created_at, nguoi_tao_id) FROM stdin;
1	1	45_CV_BGDDT_KiemDinh.pdf	van-ban-den/2026/10/23/9b3de23f8cf54a36beadee8c1402a9df.pdf	f	2026-10-10 20:53:36.990434+07	\N
2	2	118_TB_UBND_SoDoHeThong.png	van-ban-den/2026/10/23/d6e29ab17e6c4911835836271f7ed7d5.png	f	2026-10-10 20:53:36.994869+07	\N
3	3	89_CV_STTTT_AnToanTT.docx	van-ban-den/2026/10/23/5af182f8ce884a0a927627dee84adfc0.docx	f	2026-10-10 20:53:36.995187+07	\N
4	4	26_HD_SGDDT_HuongNghiep.pdf	van-ban-den/2026/10/23/46c3b701b4844c48968b412c9dd7a477.pdf	f	2026-10-10 20:53:36.995452+07	\N
5	5	05_TB_TTr_BGD_ThanhTra.png	van-ban-den/2026/10/23/cc72cdd7a31a41109a9a837a5f3e28d6.png	f	2026-10-10 20:53:36.995692+07	\N
18	18	215_CV_TCGDNN_TuyenSinh.pdf	van-ban-den/2026/10/23/f5ef1cba311a4734ac3079e4c96cf9c2.pdf	f	2026-10-23 21:33:06.50479+07	1
19	19	78_TB_SLDTBXH_HoiThi.docx	van-ban-den/2026/10/23/6ffd6c15603442429f6314ae38915819.docx	f	2026-10-23 21:33:06.520708+07	1
20	20	34_CV_CATP_AnNinh.docx	van-ban-den/2026/10/23/1b23d6b7b2cf42108326c4c1968cfd38.docx	f	2026-10-23 21:33:06.5218+07	1
21	21	19_HD_LDLD_2011.pdf	van-ban-den/2026/10/23/fc09d03793374eb68bd9664c023db2d8.pdf	f	2026-10-23 21:33:06.5218+07	1
22	22	12_CV_BYT_PhongDich.pdf	van-ban-den/2026/10/23/67cfdda7f79047d6a77e627d2f682fca.pdf	f	2026-10-23 21:33:06.5218+07	1
23	23	67_TB_BGDDT_NCKH.docx	van-ban-den/2026/10/23/65e13038b39148dba0dd308cb961251f.docx	f	2026-10-23 21:33:06.5218+07	1
24	24	03_CV_BHXH_BHYT.pdf	van-ban-den/2026/10/23/a81da6e07c8f44d4a94ae2f4e5e67f27.pdf	f	2026-10-23 21:33:06.538425+07	1
\.


--
-- Data for Name: documents_vanbanden_danhmuc; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbanden_danhmuc (vanbanden_id, loaivanban_id) FROM stdin;
\.


--
-- Data for Name: documents_vanbanden_donvinhan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbanden_donvinhan (vanbanden_id, donvi_id) FROM stdin;
\.


--
-- Data for Name: documents_vanbanden_hoso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbanden_hoso (vanbanden_id, hoso_id) FROM stdin;
\.


--
-- Data for Name: documents_vanbanden_nguoinhan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbanden_nguoinhan (vanbanden_id, employee_id) FROM stdin;
\.


--
-- Data for Name: documents_vanbandi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbandi (id, nam, so_hieu, so_thu_tu, ngay_ban_hanh, trich_yeu, ngay_van_ban, nguoi_ky, chuc_vu, hieu_luc, ngay_het_hieu_luc, link_thay_the, ghi_chu, hien_thi, gui_mail_toan_he_thong, pham_vi, nguoi_tao_id, created_at, updated_at) FROM stdin;
13	2026	DEMO-KY-8-1	11	2026-10-23 19:55:40.525786+07	Tờ trình đề xuất mua sắm thiết bị phòng máy năm 2026	2026-10-23 19:55:40.525786+07			CON_HIEU_LUC	\N			t	f	NOI_BO	15	2026-10-23 19:55:40.525786+07	2026-10-23 19:55:40.525786+07
14	2026	DEMO-KY-8-2	12	2026-10-23 19:55:40.555569+07	Quyết định thành lập hội đồng nghiệm thu đề tài cấp cơ sở	2026-10-23 19:55:40.555569+07			CON_HIEU_LUC	\N			t	f	NOI_BO	14	2026-10-23 19:55:40.555569+07	2026-10-23 19:55:40.555569+07
15	2026	DEMO-KY-8-3	13	2026-10-23 19:55:40.555569+07	Kế hoạch tổ chức hội nghị tổng kết công tác quý IV	2026-10-23 19:55:40.555569+07			CON_HIEU_LUC	\N			t	f	NOI_BO	15	2026-10-23 19:55:40.565879+07	2026-10-23 19:55:40.565879+07
16	2026	DEMO-KY-8-4	14	2026-10-23 19:55:40.57167+07	Báo cáo kết quả thực hiện nhiệm vụ khoa học công nghệ	2026-10-23 19:55:40.57167+07			CON_HIEU_LUC	\N			t	f	NOI_BO	14	2026-10-23 19:55:40.57167+07	2026-10-23 19:55:40.57167+07
17	2026	DEMO-KY-8-5	15	2026-10-23 19:55:40.578245+07	Công văn đề nghị gia hạn hợp đồng thuê bao đường truyền	2026-10-23 19:55:40.578245+07			CON_HIEU_LUC	\N			t	f	NOI_BO	15	2026-10-23 19:55:40.578245+07	2026-10-23 19:55:40.578245+07
18	2026	DEMO-KY-9-1	16	2026-10-23 19:55:43.19065+07	Tờ trình đề xuất mua sắm thiết bị phòng máy năm 2026	2026-10-23 19:55:43.19065+07			CON_HIEU_LUC	\N			t	f	NOI_BO	15	2026-10-23 19:55:43.19065+07	2026-10-23 19:55:43.19065+07
19	2026	DEMO-KY-9-2	17	2026-10-23 19:55:43.215484+07	Quyết định thành lập hội đồng nghiệm thu đề tài cấp cơ sở	2026-10-23 19:55:43.215484+07			CON_HIEU_LUC	\N			t	f	NOI_BO	14	2026-10-23 19:55:43.215484+07	2026-10-23 19:55:43.215484+07
20	2026	DEMO-KY-9-3	18	2026-10-23 19:55:43.223865+07	Kế hoạch tổ chức hội nghị tổng kết công tác quý IV	2026-10-23 19:55:43.223865+07			CON_HIEU_LUC	\N			t	f	NOI_BO	15	2026-10-23 19:55:43.223865+07	2026-10-23 19:55:43.223865+07
21	2026	DEMO-KY-9-4	19	2026-10-23 19:55:43.22908+07	Báo cáo kết quả thực hiện nhiệm vụ khoa học công nghệ	2026-10-23 19:55:43.22908+07			CON_HIEU_LUC	\N			t	f	NOI_BO	14	2026-10-23 19:55:43.22908+07	2026-10-23 19:55:43.22908+07
22	2026	DEMO-KY-9-5	20	2026-10-23 19:55:43.234897+07	Công văn đề nghị gia hạn hợp đồng thuê bao đường truyền	2026-10-23 19:55:43.234897+07			CON_HIEU_LUC	\N			t	f	NOI_BO	15	2026-10-23 19:55:43.234897+07	2026-10-23 19:55:43.234897+07
23	2026	DEMO-KY-7-1	21	2026-10-23 19:55:45.856152+07	Tờ trình đề xuất mua sắm thiết bị phòng máy năm 2026	2026-10-23 19:55:45.856152+07			CON_HIEU_LUC	\N			t	f	NOI_BO	15	2026-10-23 19:55:45.859325+07	2026-10-23 19:55:45.859325+07
24	2026	DEMO-KY-7-2	22	2026-10-23 19:55:45.884358+07	Quyết định thành lập hội đồng nghiệm thu đề tài cấp cơ sở	2026-10-23 19:55:45.884358+07			CON_HIEU_LUC	\N			t	f	NOI_BO	14	2026-10-23 19:55:45.885931+07	2026-10-23 19:55:45.885931+07
25	2026	DEMO-KY-7-3	23	2026-10-23 19:55:45.893693+07	Kế hoạch tổ chức hội nghị tổng kết công tác quý IV	2026-10-23 19:55:45.893693+07			CON_HIEU_LUC	\N			t	f	NOI_BO	15	2026-10-23 19:55:45.895236+07	2026-10-23 19:55:45.895236+07
26	2026	DEMO-KY-7-4	24	2026-10-23 19:55:45.901012+07	Báo cáo kết quả thực hiện nhiệm vụ khoa học công nghệ	2026-10-23 19:55:45.901012+07			CON_HIEU_LUC	\N			t	f	NOI_BO	14	2026-10-23 19:55:45.902068+07	2026-10-23 19:55:45.902068+07
27	2026	DEMO-KY-7-5	25	2026-10-23 19:55:45.908831+07	Công văn đề nghị gia hạn hợp đồng thuê bao đường truyền	2026-10-23 19:55:45.908831+07			CON_HIEU_LUC	\N			t	f	NOI_BO	15	2026-10-23 19:55:45.910276+07	2026-10-23 19:55:45.910276+07
1	2026	15/QĐ-ITC/2026	1	2026-10-23 09:00:00+07	Quyết định ban hành Quy chế bảo vệ thông tin và vận hành hệ thống phần mềm ITC	2026-10-23 09:00:00+07	Tô Thanh Tân - Trưởng phòng Hành chính - Tổng hợp	Trưởng phòng HC-TH	CON_HIEU_LUC	\N	\N	\N	t	f	NOI_BO	1	2026-10-10 15:14:47.563462+07	2026-10-23 21:33:06.46459+07
2	2026	14/TB-ITC/2026	2	2026-10-22 10:00:00+07	Thông báo kế hoạch phát động phong trào thi đua dạy tốt - học tốt năm học 2026	2026-10-22 10:00:00+07	Châu Tuấn Kiệt - Đại diện Ban Giám hiệu	Đại diện Ban Giám hiệu	CON_HIEU_LUC	\N	\N	\N	t	f	NOI_BO	1	2026-10-10 14:14:56.407367+07	2026-10-23 21:33:06.46459+07
3	2026	13/KH-ITC/2026	3	2026-10-21 15:30:00+07	Kế hoạch nâng cấp hạ tầng mạng máy tính thực hành Khoa Công nghệ Thông tin	2026-10-21 15:30:00+07	Nguyễn Tấn Lộc Khiêm - Trưởng Khoa CNTT	Trưởng Khoa CNTT	CON_HIEU_LUC	\N	\N	\N	t	f	NOI_BO	1	2026-10-10 14:14:56.407367+07	2026-10-23 21:33:06.46459+07
4	2026	12/QĐ-ITC/2026	4	2026-10-19 08:45:00+07	Quyết định kiện toàn Ban chỉ đạo Đảm bảo An toàn thông tin và Chuyển đổi số ITC	2026-10-19 08:45:00+07	Lê Thanh Hậu - Phó Ban Chuyển đổi số	Phó Ban Chuyển đổi số	CON_HIEU_LUC	\N	\N	\N	t	f	NOI_BO	1	2026-10-10 14:14:56.407367+07	2026-10-23 21:33:06.46459+07
5	2026	11/TB-ITC/2026	5	2026-10-16 11:15:00+07	Thông báo lịch thi đánh giá chuẩn đầu ra Tin học ứng dụng & Ngoại ngữ đợt 1/2026	2026-10-16 11:15:00+07	Nguyễn Anh Đô - Trưởng phòng Đào tạo	Trưởng phòng Đào tạo	CON_HIEU_LUC	\N	\N	\N	t	f	HAN_CHE	1	2026-10-10 14:14:56.407367+07	2026-10-23 21:33:06.46459+07
8	2026	10/TB-ITC/2026	6	2026-06-15 14:00:00+07	Thông báo kế hoạch nghỉ hè và đăng ký bồi dưỡng chuyên môn nghiệp vụ hè 2026	2026-06-15 14:00:00+07	Phan Tạ Hữu Đức - Trưởng phòng Đào tạo	Trưởng phòng Đào tạo	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 19:25:51.448766+07	2026-10-23 21:33:06.46459+07
9	2026	09/QĐ-ITC/2026	7	2026-05-05 09:00:00+07	Quyết định phê duyệt danh mục đề tài Nghiên cứu khoa học sinh viên năm 2025 - 2026	2026-05-05 09:00:00+07	Thượng Mạnh Quỳnh - Trưởng phòng QLKH	Trưởng phòng QLKH	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 19:25:51.49803+07	2026-10-23 21:33:06.46459+07
10	2026	08/TB-ITC/2026	8	2026-04-10 08:00:00+07	Triển khai cấp phát chứng thư số cá nhân và chữ ký số điện tử cho toàn thể cán bộ	2026-04-10 08:00:00+07	Lê Thanh Hậu - Trưởng phòng Ký số	Trưởng phòng Ký số	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 19:25:51.515044+07	2026-10-23 21:33:06.46459+07
11	2026	07/CV-ITC/2026	9	2026-03-20 10:15:00+07	Công văn gửi Sở GD&ĐT TP.HCM về việc phối hợp tổ chức tư vấn hướng nghiệp	2026-03-20 10:15:00+07	Trần Nhật Tân - Phó Giám đốc Trung tâm	Phó Giám đốc Trung tâm	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 19:25:51.515044+07	2026-10-23 21:33:06.46459+07
12	2026	06/KH-ITC/2026	10	2026-03-01 14:00:00+07	Kế hoạch tổ chức Hội thao và Hội diễn văn nghệ chào mừng Ngày thành lập Đoàn 26/3	2026-03-01 14:00:00+07	Đặng Trường Thịnh - Bí thư Đoàn trường	Bí thư Đoàn trường	CON_HIEU_LUC	\N			t	f	NOI_BO	1	2026-10-23 19:25:51.525935+07	2026-10-23 21:33:06.46459+07
39	2026	101/TTr-CNTT	26	2026-10-24 09:58:21.969651+07	Tờ trình nâng cấp hệ thống sao lưu dữ liệu nghiệp vụ bảo hiểm	2026-10-24 09:58:21.969651+07			CON_HIEU_LUC	\N			t	f	NOI_BO	7	2026-10-24 09:58:21.969651+07	2026-10-24 09:58:21.969651+07
40	2026	102/TTr-CNTT	27	2026-10-24 09:58:22.2445+07	Tờ trình mua sắm thiết bị mạng cho văn phòng khu vực	2026-10-24 09:58:22.2445+07			CON_HIEU_LUC	\N			t	f	NOI_BO	6	2026-10-24 09:58:22.2445+07	2026-10-24 09:58:22.2445+07
41	2026	103/KH-CNTT	28	2026-10-24 09:58:22.328109+07	Kế hoạch triển khai hệ thống quản lý văn bản điện tử năm 2027	2026-10-24 09:58:22.328109+07			CON_HIEU_LUC	\N			t	f	NOI_BO	6	2026-10-24 09:58:22.329166+07	2026-10-24 09:58:22.329166+07
42	2026	104/BC-CNTT	29	2026-10-24 09:58:22.422104+07	Báo cáo tổng kết công tác an toàn thông tin quý III	2026-10-24 09:58:22.422104+07			CON_HIEU_LUC	\N			t	f	NOI_BO	6	2026-10-24 09:58:22.423298+07	2026-10-24 09:58:22.423298+07
43	2026	105/ĐX-CNTT	30	2026-10-24 09:58:22.724087+07	Đề xuất thuê dịch vụ trung tâm dữ liệu dự phòng	2026-10-24 09:58:22.724087+07			CON_HIEU_LUC	\N			t	f	NOI_BO	6	2026-10-24 09:58:22.725219+07	2026-10-24 09:58:22.725219+07
44	2026	106/TTr-CNTT	31	2026-10-24 09:58:22.86504+07	Tờ trình phê duyệt dự toán bảo trì phần mềm nghiệp vụ	2026-10-24 09:58:22.86504+07			CON_HIEU_LUC	\N			t	f	NOI_BO	6	2026-10-24 09:58:22.865682+07	2026-10-24 09:58:22.865682+07
45	2026	107/QĐ-CNTT	32	2026-10-24 09:58:22.966434+07	Dự thảo quyết định ban hành quy chế sử dụng chữ ký số nội bộ	2026-10-24 09:58:22.966434+07			CON_HIEU_LUC	\N			t	f	NOI_BO	6	2026-10-24 09:58:22.967458+07	2026-10-24 09:58:22.967458+07
46	2026	108/TB-CNTT	33	2026-10-24 09:58:23.11789+07	Thông báo lịch bảo trì hệ thống thư điện tử	2026-10-24 09:58:23.11789+07			CON_HIEU_LUC	\N			t	f	NOI_BO	6	2026-10-24 09:58:23.119004+07	2026-10-24 09:58:23.119004+07
47	2026	109/TTr-CNTT	34	2026-10-24 09:58:23.184518+07	Tờ trình gia hạn bản quyền phần mềm diệt mã độc	2026-10-24 09:58:23.184518+07			CON_HIEU_LUC	\N			t	f	NOI_BO	6	2026-10-24 09:58:23.185561+07	2026-10-24 09:58:23.185561+07
48	2026	110/BC-CNTT	35	2026-10-24 09:58:23.240135+07	Báo cáo đánh giá rủi ro hệ thống thanh toán phí bảo hiểm	2026-10-24 09:58:23.240135+07			CON_HIEU_LUC	\N			t	f	NOI_BO	6	2026-10-24 09:58:23.241214+07	2026-10-24 09:58:23.241214+07
\.


--
-- Data for Name: documents_vanbandi_attachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbandi_attachment (id, document_id, name, path, is_deleted, created_at, nguoi_tao_id) FROM stdin;
1	1	15_QD_ITC_BaoVeThongTin.docx	van-ban-di/2026/10/23/9758bb871ee842228d710da0c106b7f7.docx	f	2026-10-10 20:53:36.995939+07	\N
2	2	14_TB_ITC_ThiDuaDayTot.pdf	van-ban-di/2026/10/23/a4c65b0beb094e7c916251574cc0c0f2.pdf	f	2026-10-10 20:53:36.998795+07	\N
3	3	13_KH_ITC_SoDoHaTang.png	van-ban-di/2026/10/23/a3a9751b66e7488ea218f42f3910c0e4.png	f	2026-10-10 20:53:36.999089+07	\N
4	4	12_QD_ITC_KienToanBCĐ.pdf	van-ban-di/2026/10/23/5aed921e90524372bc9ccf0980ccf3e5.pdf	f	2026-10-10 20:53:36.999366+07	\N
5	5	11_TB_ITC_ThiChuanDauRa.pdf	van-ban-di/2026/10/23/d22c1d8f0feb4e119677882564a979df.pdf	f	2026-10-10 20:53:36.999711+07	\N
10	8	10_TB_ITC_NghiHe2026.docx	van-ban-di/2026/10/23/76bec74197be4056a3ab27fe6adebf0b.docx	f	2026-10-23 21:33:06.570347+07	1
11	9	09_QD_ITC_NCKHSinhVien.docx	van-ban-di/2026/10/23/68d72be119dc4f87a552e94acb7d931b.docx	f	2026-10-23 21:33:06.570347+07	1
12	10	08_TB_ITC_CapPhatChuKySo.docx	van-ban-di/2026/10/23/0cc1a2efd0924a779bbbda0a964e3745.docx	f	2026-10-23 21:33:06.570347+07	1
13	11	07_CV_ITC_GuiSoGDDT.pdf	van-ban-di/2026/10/23/8a9e666f9d364003ac64382f72a531e2.pdf	f	2026-10-23 21:33:06.590118+07	1
14	12	06_KH_ITC_HoiThao263.docx	van-ban-di/2026/10/23/66d566ad23004dbcbb35451b264a221a.docx	f	2026-10-23 21:33:06.590118+07	1
\.


--
-- Data for Name: documents_vanbandi_danhmuc; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbandi_danhmuc (vanbandi_id, loaivanban_id) FROM stdin;
\.


--
-- Data for Name: documents_vanbandi_donvinhan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbandi_donvinhan (vanbandi_id, donvi_id) FROM stdin;
\.


--
-- Data for Name: documents_vanbandi_hoso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbandi_hoso (vanbandi_id, hoso_id) FROM stdin;
\.


--
-- Data for Name: documents_vanbandi_nguoinhan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbandi_nguoinhan (vanbandi_id, employee_id) FROM stdin;
\.


--
-- Data for Name: documents_vanbandi_noibanhanh; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_vanbandi_noibanhanh (vanbandi_id, donvi_id) FROM stdin;
\.


--
-- Data for Name: documents_view_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_view_log (id, document_type, document_id, user_id, viewed_at) FROM stdin;
\.


--
-- Data for Name: meetings_meetingbooking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meetings_meetingbooking (id, room_id, organizer_id, department_id, title, date, start_time, end_time, attendees_count, purpose, trang_thai, created_at) FROM stdin;
\.


--
-- Data for Name: meetings_meetingroom; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meetings_meetingroom (id, name, location, capacity, amenities, is_public, trang_thai, ghi_chu, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: organizations_donvi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations_donvi (id, khoi_id, stt_uu_tien, ten, dia_chi, dien_thoai, email, is_public, ghi_chu) FROM stdin;
1	9	1	Ban tổng giám đốc	\N	\N	\N	t	\N
2	9	2	Giám đốc vùng	\N	\N	\N	t	\N
3	7	3	Giám định vùng	\N	\N	\N	t	\N
4	2	4	Ban kiểm toán nội bộ	\N	\N	\N	t	\N
5	2	5	Hội đồng quản trị	\N	\N	\N	t	\N
6	16	6	Ban công nghệ thông tin	\N	\N	\N	t	\N
7	16	7	Ban hành chính quản trị	\N	\N	\N	t	\N
8	16	8	Ban nhân sự	\N	\N	\N	t	\N
9	16	9	Ban pháp chế	\N	\N	\N	t	\N
10	16	10	Ban truyền thông và marketing	\N	\N	\N	t	\N
11	16	11	Lãnh đạo khối	\N	\N	\N	t	\N
12	11	12	Ban kế toán	\N	\N	\N	t	\N
13	11	13	Lãnh đạo khối	\N	\N	\N	t	\N
14	15	14	Ban Bancassurance	\N	\N	\N	t	\N
15	15	15	Ban chăm sóc khách hàng ĐT	\N	\N	\N	t	\N
16	15	16	Ban dự án khách hàng qua đại lý	\N	\N	\N	t	\N
17	15	17	Ban dự án lớn	\N	\N	\N	t	\N
18	15	18	Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông	\N	\N	\N	t	\N
19	15	19	Ban khách hàng cá nhân	\N	\N	\N	t	\N
20	15	20	Ban khách hàng doanh nghiệp	\N	\N	\N	t	\N
21	15	21	Ban khách hàng qua môi giới	\N	\N	\N	t	\N
22	5	22	Ban bảo hiểm con người	\N	\N	\N	t	\N
23	5	23	Ban bảo hiểm hàng hải, hàng không, dầu khí, năng lượng	\N	\N	\N	t	\N
24	5	24	Ban bảo hiểm tài sản kỹ thuật	\N	\N	\N	t	\N
25	5	25	Ban bảo hiểm xe cơ giới	\N	\N	\N	t	\N
26	5	26	Ban tái bảo hiểm	\N	\N	\N	t	\N
27	4	27	Ban quản lý rủi ro và tuân thủ	\N	\N	\N	t	\N
28	13	28	Ban đầu tư	\N	\N	\N	t	\N
29	13	29	Ban dự án MIS	\N	\N	\N	t	\N
30	13	30	Ban tài chính kế hoạch	\N	\N	\N	t	\N
31	8	31	Bảo Long Bình Dương	\N	\N	\N	t	\N
32	8	32	Bảo Long Cà Mau	\N	\N	\N	t	\N
33	8	33	Bảo Long Cần Thơ	\N	\N	\N	t	\N
34	8	34	Bảo Long Đồng Nai	\N	\N	\N	t	\N
35	8	35	Bảo Long Đồng Tháp	\N	\N	\N	t	\N
36	8	36	Bảo Long Kiên Giang	\N	\N	\N	t	\N
37	8	37	Bảo Long Long An	\N	\N	\N	t	\N
38	8	38	Bảo Long Tây Ninh	\N	\N	\N	t	\N
39	8	39	Bảo Long Vũng Tàu	\N	\N	\N	t	\N
40	14	40	Bảo Long Bắc Ninh	\N	\N	\N	t	\N
41	14	41	Bảo Long Đông Đô	\N	\N	\N	t	\N
42	14	42	Bảo Long Đông Hải	\N	\N	\N	t	\N
43	14	43	Bảo Long Hà Nội	\N	\N	\N	t	\N
44	14	44	Bảo Long Hải Dương	\N	\N	\N	t	\N
45	14	45	Bảo Long Hải Phòng	\N	\N	\N	t	\N
46	14	46	Bảo Long Nam Định	\N	\N	\N	t	\N
47	14	47	Bảo Long Ninh Bình	\N	\N	\N	t	\N
48	14	48	Bảo Long Phú Thọ	\N	\N	\N	t	\N
49	14	49	Bảo Long Quảng Ninh	\N	\N	\N	t	\N
50	14	50	Bảo Long Thái Bình	\N	\N	\N	t	\N
51	14	51	Bảo Long Thái Nguyên	\N	\N	\N	t	\N
52	14	52	Bảo Long Thăng Long	\N	\N	\N	t	\N
53	14	53	Bảo Long Thanh Hóa	\N	\N	\N	t	\N
54	14	54	Bảo Long Thủ Đô	\N	\N	\N	t	\N
55	14	55	Bảo Long Vĩnh Phúc	\N	\N	\N	t	\N
56	14	56	Sở giao dịch miền Bắc	\N	\N	\N	t	\N
57	12	57	Bảo Long Bắc Trung Bộ (Nghệ An)	\N	\N	\N	t	\N
58	12	58	Bảo Long Bình Định	\N	\N	\N	t	\N
59	12	59	Bảo Long Bình Thuận	\N	\N	\N	t	\N
60	12	60	Bảo Long Đà Nẵng	\N	\N	\N	t	\N
61	12	61	Bảo Long Gia Lai	\N	\N	\N	t	\N
62	12	62	Bảo Long Khánh Hòa	\N	\N	\N	t	\N
63	12	63	Bảo Long KV Tây Nguyên (Daklak)	\N	\N	\N	t	\N
64	12	64	Bảo Long Lâm Đồng	\N	\N	\N	t	\N
65	12	65	Bảo Long Phú Yên	\N	\N	\N	t	\N
66	12	66	Bảo Long Quảng Bình	\N	\N	\N	t	\N
67	12	67	Bảo Long Quảng Ngãi	\N	\N	\N	t	\N
68	12	68	Bảo Long Trung Bộ (Huế)	\N	\N	\N	t	\N
69	12	69	Trung tâm kinh doanh Sông Hàn	\N	\N	\N	t	\N
70	10	70	Bảo Long Bến Thành	\N	\N	\N	t	\N
71	10	71	Bảo Long Đông Phương	\N	\N	\N	t	\N
72	10	72	Bảo Long Đông Sài Gòn	\N	\N	\N	t	\N
73	10	73	Bảo Long Gia Định	\N	\N	\N	t	\N
74	10	74	Bảo Long Nam Sài Gòn	\N	\N	\N	t	\N
75	10	75	Bảo Long Sài Gòn	\N	\N	\N	t	\N
76	10	76	Bảo Long Tân Sơn Nhất	\N	\N	\N	t	\N
77	10	77	Bảo Long TP.HCM	\N	\N	\N	t	\N
78	10	78	Sở giao dịch Bảo Long	\N	\N	\N	t	\N
79	10	79	Trung tâm kinh doanh Thủ Thiêm	\N	\N	\N	t	\N
80	1	80	Văn phòng 2	\N	\N	\N	t	\N
81	3	81	Văn phòng ban điều hành	\N	\N	\N	t	\N
82	6	82	Văn phòng hội đồng quản trị	\N	\N	\N	t	\N
\.


--
-- Data for Name: organizations_khoi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations_khoi (id, ten, thu_tu_hien_thi) FROM stdin;
1	VĂN PHÒNG 2	14
2	HỘI ĐỒNG QUẢN TRỊ	3
3	VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI	15
4	KHỐI QUẢN LÝ RỦI RO	8
5	KHỐI NGHIỆP VỤ	7
6	VĂN PHÒNG HỘI ĐỒNG QUẢN TRỊ	16
7	GIÁM ĐỊNH VÙNG	2
8	KHU VỰC ĐÔNG NAM BỘ	10
9	BAN TỔNG GIÁM ĐỐC	1
10	KHU VỰC THÀNH PHỐ HỒ CHÍ MINH	13
11	KHỐI KẾ TOÁN	5
12	KHU VỰC MIỀN TRUNG TÂY NGUYÊN	12
13	KHỐI TÀI CHÍNH	9
14	KHU VỰC MIỀN BẮC	11
15	KHỐI KINH DOANH	6
16	KHỐI HỖ TRỢ	4
\.


--
-- Data for Name: records_chitiettailieu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.records_chitiettailieu (id, dm_tai_lieu, ky_hieu, tieu_de, ngay_dang, noi_ban_hanh, hieu_luc, ngay_het_hieu_luc, link_thay_the, ghi_chu, hien_thi, don_vi_id, nguoi_tao_id, created_at, updated_at) FROM stdin;
6	3	BM-01/TCKT	Giấy đề nghị thanh toán tạm ứng & công tác phí	2026-01-15	Ban Tài chính - Kế toán	CON_HIEU_LUC	\N	\N	Biểu mẫu bảng tính Excel gồm 2 sheet: Đề nghị thanh toán và Bảng định mức công tác phí nội bộ.	TAT_CA	\N	1	2026-10-22 09:56:58.206566+07	2026-10-23 18:22:58.119755+07
7	3	BM-02/VP	Tờ trình phê duyệt chủ trương và kế hoạch công tác	2026-01-15	Văn phòng Tổng Công ty	CON_HIEU_LUC	\N	\N	Mẫu tờ trình chuẩn dùng cho các Ban/Phòng/Chi nhánh trình Ban Giám đốc phê duyệt chủ trương và kinh phí.	TAT_CA	\N	1	2026-10-22 09:56:58.218179+07	2026-10-23 18:22:58.214767+07
8	3	BM-03/NS	Đơn xin nghỉ phép và bàn giao công việc	2026-01-15	Ban Quản trị Nguồn Nhân lực	CON_HIEU_LUC	\N	\N	Mẫu đơn xin nghỉ phép năm, nghỉ việc riêng có bảng bàn giao chi tiết công việc cho đồng nghiệp.	TAT_CA	\N	1	2026-10-22 09:56:58.223703+07	2026-10-23 18:22:58.250424+07
9	3	BM-04/GD	Biên bản giám định hiện trường tổn thất xe cơ giới	2026-01-15	Khối Giám định Bồi thường	CON_HIEU_LUC	\N	\N	Biểu mẫu PDF chính quy lập biên bản giám định hiện trường vụ việc tổn thất xe cơ giới kèm bảng giá linh kiện.	TAT_CA	\N	1	2026-10-22 09:56:58.223703+07	2026-10-23 18:22:58.290378+07
10	3	BM-05/CNTT	Phiếu yêu cầu cấp phát thiết bị và quyền truy cập hệ thống CNTT	2026-01-15	Khối Công nghệ Thông tin	CON_HIEU_LUC	\N	\N	Biểu mẫu đề xuất cấp máy tính, tài khoản email và phân quyền phần mềm điều hành theo ISO 27001.	TAT_CA	\N	1	2026-10-22 09:56:58.234676+07	2026-10-23 18:22:58.322381+07
11	3	BM-06/KD	Giấy yêu cầu bảo hiểm và bảng kê khai rủi ro doanh nghiệp	2026-01-15	Ban Kinh doanh & Khai thác	CON_HIEU_LUC	\N	\N	Mẫu văn bản PDF yêu cầu bảo hiểm tài sản, kỹ thuật và trách nhiệm doanh nghiệp kèm bảng kê tài sản 248 tỷ.	TAT_CA	\N	1	2026-10-22 09:56:58.239879+07	2026-10-23 18:22:58.354141+07
12	3	BM-07/PC	Thỏa thuận bảo mật thông tin và dữ liệu kinh doanh (NDA)	2026-01-15	Phòng Pháp chế & Tuân thủ	CON_HIEU_LUC	\N	\N	Mẫu thỏa thuận pháp lý chuẩn ký kết với các đối tác tư vấn và nhà cung cấp dịch vụ số.	TAT_CA	\N	1	2026-10-23 18:22:58.380303+07	2026-10-23 18:22:58.380303+07
13	3	BM-08/TCKT	Bảng kê chứng từ hóa đơn thanh toán và quyết toán tạm ứng nội bộ	2026-01-15	Ban Tài chính - Kế toán	CON_HIEU_LUC	\N	\N	Mẫu bảng kê hóa đơn điện tử chi tiết có công thức tính thuế VAT và tổng tiền thanh toán tự động.	TAT_CA	\N	1	2026-10-23 18:22:58.412091+07	2026-10-23 18:22:58.412091+07
\.


--
-- Data for Name: records_chitiettailieu_attachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.records_chitiettailieu_attachment (id, document_id, name, path, file_size, mime_type, is_deleted, created_at, nguoi_tao_id) FROM stdin;
6	6	BM-01-TCKT_Giay_de_nghi_thanh_toan.xlsx	/media/document_templates/BM-01-TCKT_Giay_de_nghi_thanh_toan.xlsx	8359	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	f	2026-10-22 09:56:58.218179+07	1
7	7	BM-02-VP_To_trinh_ke_hoach_cong_tac.docx	/media/document_templates/BM-02-VP_To_trinh_ke_hoach_cong_tac.docx	39093	application/vnd.openxmlformats-officedocument.wordprocessingml.document	f	2026-10-22 09:56:58.223703+07	1
8	8	BM-03-NS_Don_xin_nghi_phep_va_ban_giao.docx	/media/document_templates/BM-03-NS_Don_xin_nghi_phep_va_ban_giao.docx	38440	application/vnd.openxmlformats-officedocument.wordprocessingml.document	f	2026-10-22 09:56:58.223703+07	1
9	9	BM-04-GD_Bien_ban_giam_dinh_ton_that_xe.pdf	/media/document_templates/BM-04-GD_Bien_ban_giam_dinh_ton_that_xe.pdf	117522	application/pdf	f	2026-10-22 09:56:58.234676+07	1
10	10	BM-05-CNTT_Yeu_cau_cap_quyen_he_thong.docx	/media/document_templates/BM-05-CNTT_Yeu_cau_cap_quyen_he_thong.docx	38518	application/vnd.openxmlformats-officedocument.wordprocessingml.document	f	2026-10-22 09:56:58.234676+07	1
11	11	BM-06-KD_Giay_yeu_cau_bao_hiem_DN.pdf	/media/document_templates/BM-06-KD_Giay_yeu_cau_bao_hiem_DN.pdf	117518	application/pdf	f	2026-10-22 09:56:58.239879+07	1
12	12	BM-07-PC_Hop_dong_dich_vu_va_thoa_thuan_NDA.docx	/media/document_templates/BM-07-PC_Hop_dong_dich_vu_va_thoa_thuan_NDA.docx	38169	application/vnd.openxmlformats-officedocument.wordprocessingml.document	f	2026-10-23 18:22:58.385139+07	1
13	13	BM-08-TCKT_Bang_ke_quyet_toan_tam_ung.xlsx	/media/document_templates/BM-08-TCKT_Bang_ke_quyet_toan_tam_ung.xlsx	6679	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	f	2026-10-23 18:22:58.412091+07	1
\.


--
-- Data for Name: records_chitiettailieu_loaitailieu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.records_chitiettailieu_loaitailieu (chitiettailieu_id, loaitailieu_id) FROM stdin;
6	2
7	1
8	3
9	4
10	5
11	6
12	7
13	2
\.


--
-- Data for Name: records_hoso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.records_hoso (id, stt_uu_tien, so_ky_hieu, ten_ho_so, nguoi_lap_id, ngay_lap, ghi_chu, is_he_thong, created_at, updated_at) FROM stdin;
1	1	HSC	Hồ sơ chung	1	\N	Hồ sơ chung mặc định của hệ thống - không được xóa	t	2026-10-10 13:23:40.927625+07	2026-10-10 13:23:40.927625+07
\.


--
-- Data for Name: records_loaitailieu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.records_loaitailieu (id, dm_tai_lieu, ten_loai, is_public, ngay_lap, ghi_chu, created_at, updated_at) FROM stdin;
1	3	Hành chính - Văn phòng	t	\N	Mẫu tờ trình, công văn, biên bản	2026-10-22 09:56:58.19547+07	2026-10-22 09:56:58.19547+07
2	3	Tài chính - Kế toán	t	\N	Mẫu thanh toán, tạm ứng, quyết toán	2026-10-22 09:56:58.202054+07	2026-10-22 09:56:58.202054+07
3	3	Nhân sự - Tiền lương	t	\N	Mẫu phép, công tác, hợp đồng	2026-10-22 09:56:58.202054+07	2026-10-22 09:56:58.202054+07
4	3	Giám định - Bồi thường	t	\N	Mẫu hồ sơ tổn thất, biên bản giám định	2026-10-22 09:56:58.202054+07	2026-10-22 09:56:58.202054+07
5	3	Công nghệ thông tin	t	\N	Mẫu cấp phát tài khoản, thiết bị CNTT	2026-10-22 09:56:58.202054+07	2026-10-22 09:56:58.202054+07
6	3	Kinh doanh bảo hiểm	t	\N	Giấy yêu cầu bảo hiểm, bảng kê	2026-10-22 09:56:58.206566+07	2026-10-22 09:56:58.206566+07
7	3	Pháp chế & Tuân thủ	t	\N	Hợp đồng dịch vụ, bảo mật NDA	2026-10-23 18:22:58.083286+07	2026-10-23 18:22:58.083286+07
\.


--
-- Data for Name: records_loaivanban; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.records_loaivanban (id, ho_so_id, ten_loai, ngay_lap, ghi_chu, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: records_tailieu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.records_tailieu (id, stt_uu_tien, ky_hieu, ten_tai_lieu, nguoi_lap_id, ngay_lap, ghi_chu, created_at, updated_at) FROM stdin;
2	1	DM-BM	Danh mục biểu mẫu hành chính - nhân sự	1	2026-01-01	\N	2026-10-10 21:35:00.498155+07	2026-10-10 21:35:00.498155+07
3	2	BM-CHUNG	Hệ thống Biểu mẫu ban hành chung	1	2026-01-01	Các biểu mẫu chuẩn áp dụng trong toàn hệ thống Bảo Long Insurance	2026-10-22 09:56:58.190045+07	2026-10-22 09:56:58.190045+07
\.


--
-- Data for Name: signing_attempt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_attempt (id, trinh_ky_id, so_luot, phien_ban_van_ban, vi_tri_luu_tep, ma_bam_tai_lieu, trang_thai, ly_do, khoa_chong_trung, thoi_diem_gui, thoi_diem_hoan_thanh, thoi_diem_tu_choi, thoi_diem_huy, vi_tri_tep_hoan_tat, ma_bam_tep_hoan_tat, trang_thai_tep_hoan_tat, loi_tep_hoan_tat, created_at, updated_at, nguoi_tao_id, luot_truoc_id, nguoi_cap_nhat_id) FROM stdin;
1	2	1	\N	demo/DEMO-KY-1-1.pdf	ce0d9083038a6874297f422c3715a5c19adad7d98f652aa7aa7e926e5849d836	CHO_KY		\N	2026-10-22 19:25:51.448766+07	\N	\N	\N			\N		2026-10-23 19:25:51.478504+07	2026-10-23 19:25:51.478504+07	15	\N	\N
2	3	1	\N	demo/DEMO-KY-1-2.pdf	de443e17b4d1d2caad2d6e7c173253093e80f744692eaa6746c522b99f8419bb	CHO_KY		\N	2026-10-21 19:25:51.49803+07	\N	\N	\N			\N		2026-10-23 19:25:51.510175+07	2026-10-23 19:25:51.510175+07	14	\N	\N
3	4	1	\N	demo/DEMO-KY-1-3.pdf	f101acb7e44ae85f05083abeade1c24c5f5152ab3bd611acfb443d84d3789ccd	CHO_KY		\N	2026-10-20 19:25:51.514262+07	\N	\N	\N			\N		2026-10-23 19:25:51.515044+07	2026-10-23 19:25:51.515044+07	15	\N	\N
4	5	1	\N	demo/DEMO-KY-1-4.pdf	107a8b40b2e14c8ea89a333322b467f6cf90dcaa84c01796e8757b797ed7f753	HOAN_THANH		\N	2026-10-18 19:25:51.515044+07	2026-10-18 23:25:51.515044+07	\N	\N			\N		2026-10-23 19:25:51.515044+07	2026-10-23 19:25:51.515044+07	14	\N	\N
5	6	1	\N	demo/DEMO-KY-1-5.pdf	c56a56827443d4d9a79810534fc4ccb77bd954c43ba109c17e4484a2aeb24d50	TU_CHOI		\N	2026-10-17 19:25:51.525935+07	\N	2026-10-17 23:25:51.525935+07	\N			\N		2026-10-23 19:25:51.528403+07	2026-10-23 19:25:51.528403+07	15	\N	\N
6	7	1	\N	demo/DEMO-KY-8-1.pdf	268de94a48810390c8032a9f0e07eb4eaeb1179ab6e8a6b3b60461af1f38accd	CHO_KY		\N	2026-10-22 19:55:40.525786+07	\N	\N	\N			\N		2026-10-23 19:55:40.534029+07	2026-10-23 19:55:40.534029+07	15	\N	\N
7	8	1	\N	demo/DEMO-KY-8-2.pdf	4eb4627ac4258986c5ebeb428dc80c915f687a613d533ac5951866be0ba22939	CHO_KY		\N	2026-10-21 19:55:40.555569+07	\N	\N	\N			\N		2026-10-23 19:55:40.555569+07	2026-10-23 19:55:40.555569+07	14	\N	\N
8	9	1	\N	demo/DEMO-KY-8-3.pdf	40f548b156ae65258bb391b97f0f7d56d98555fa90aedc1b4d7868f8fbd24207	CHO_KY		\N	2026-10-20 19:55:40.555569+07	\N	\N	\N			\N		2026-10-23 19:55:40.565879+07	2026-10-23 19:55:40.565879+07	15	\N	\N
9	10	1	\N	demo/DEMO-KY-8-4.pdf	c545c746c72352249f84a8a3de4dc1539f1e5deef434991b7822ae90c3eef6ca	HOAN_THANH		\N	2026-10-18 19:55:40.57167+07	2026-10-18 23:55:40.57167+07	\N	\N			\N		2026-10-23 19:55:40.574968+07	2026-10-23 19:55:40.574968+07	14	\N	\N
10	11	1	\N	demo/DEMO-KY-8-5.pdf	f50f63ef2a614e7e33c1ee24a6a9c7cae9302c5446de0e1de602bd6011903dfa	TU_CHOI		\N	2026-10-17 19:55:40.578245+07	\N	2026-10-17 23:55:40.578245+07	\N			\N		2026-10-23 19:55:40.581966+07	2026-10-23 19:55:40.581966+07	15	\N	\N
11	12	1	\N	demo/DEMO-KY-9-1.pdf	dfff2638a4f65085b4d0a152fe7d084600cee88941f2465e26b96c9b1e2f906c	CHO_KY		\N	2026-10-22 19:55:43.19065+07	\N	\N	\N			\N		2026-10-23 19:55:43.197074+07	2026-10-23 19:55:43.197074+07	15	\N	\N
12	13	1	\N	demo/DEMO-KY-9-2.pdf	e1ee9ef2718dd24ee5a422b43d76358c63f5e1fd262a8d7074c3416d2baf3f15	CHO_KY		\N	2026-10-21 19:55:43.215484+07	\N	\N	\N			\N		2026-10-23 19:55:43.215484+07	2026-10-23 19:55:43.215484+07	14	\N	\N
13	14	1	\N	demo/DEMO-KY-9-3.pdf	0783573d98a0f26229a3bacc823d762b8cc70583054471b2acba6fd7c3b5043a	CHO_KY		\N	2026-10-20 19:55:43.223865+07	\N	\N	\N			\N		2026-10-23 19:55:43.223865+07	2026-10-23 19:55:43.223865+07	15	\N	\N
14	15	1	\N	demo/DEMO-KY-9-4.pdf	7bfc90a5668c33ad4ba9450925cfc92ddee53f28454666759b82bce0305f59bc	HOAN_THANH		\N	2026-10-18 19:55:43.22908+07	2026-10-18 23:55:43.22908+07	\N	\N			\N		2026-10-23 19:55:43.22908+07	2026-10-23 19:55:43.22908+07	14	\N	\N
15	16	1	\N	demo/DEMO-KY-9-5.pdf	10304e6f0c2c48158c3d9a361c8d5b71385ae801393ef665a087195ce9ac39d5	TU_CHOI		\N	2026-10-17 19:55:43.234897+07	\N	2026-10-17 23:55:43.234897+07	\N			\N		2026-10-23 19:55:43.238284+07	2026-10-23 19:55:43.238284+07	15	\N	\N
16	17	1	\N	demo/DEMO-KY-7-1.pdf	cc84e062dc1b3344677df703aa87dac5b80932729a84fa502df0fb4fc3ace51c	CHO_KY		\N	2026-10-22 19:55:45.856152+07	\N	\N	\N			\N		2026-10-23 19:55:45.862539+07	2026-10-23 19:55:45.862539+07	15	\N	\N
17	18	1	\N	demo/DEMO-KY-7-2.pdf	21246441e79a88b2325c055874743d64ea3beddd0670460d9d34d54fe8c25ce5	CHO_KY		\N	2026-10-21 19:55:45.884358+07	\N	\N	\N			\N		2026-10-23 19:55:45.891084+07	2026-10-23 19:55:45.891084+07	14	\N	\N
18	19	1	\N	demo/DEMO-KY-7-3.pdf	dbbac8bc0639be0a7e8d3c625ba9ff02511b251584630fe191acf1f0e45d127d	CHO_KY		\N	2026-10-20 19:55:45.893693+07	\N	\N	\N			\N		2026-10-23 19:55:45.897438+07	2026-10-23 19:55:45.897438+07	15	\N	\N
19	20	1	\N	demo/DEMO-KY-7-4.pdf	b0c7655966a66126e534d758d52495536f2ab8957627a01b1df5f9fc7131bc5e	HOAN_THANH		\N	2026-10-18 19:55:45.901012+07	2026-10-18 23:55:45.901012+07	\N	\N			\N		2026-10-23 19:55:45.905433+07	2026-10-23 19:55:45.905433+07	14	\N	\N
20	21	1	\N	demo/DEMO-KY-7-5.pdf	aa46f01f1de08ae95ace27fca0d12574dcb146880e377900dbb3f78685b1b4c4	TU_CHOI		\N	2026-10-17 19:55:45.908831+07	\N	2026-10-17 23:55:45.908831+07	\N			\N		2026-10-23 19:55:45.912303+07	2026-10-23 19:55:45.912303+07	15	\N	\N
21	23	1	1	trinh_ky/2026/10/870244b66df94a08b61f281444b037c6.pdf	69aecd9429a839b87a0dd7965d93af87dd4fd21b6a6577477cc293331e157c5a	CHO_KY		Dữ liệu mẫu:20261024025821761319:M02:gui	2026-10-22 06:58:22.281578+07	\N	\N	\N			\N		2026-10-22 06:58:22.281578+07	2026-10-24 09:58:22.281578+07	6	\N	\N
22	24	1	1	trinh_ky/2026/10/456e5ae6e2ad446b881127df1ebc792f.pdf	76a690df954662ab6bf3fbbfecde705fc2262cb55a50a3de0c8cbaf80a1560c1	CHO_KY		Dữ liệu mẫu:20261024025821761319:M03:gui	2026-10-20 06:58:22.371289+07	\N	\N	\N			\N		2026-10-20 06:58:22.371289+07	2026-10-24 09:58:22.371289+07	6	\N	\N
25	28	1	1	trinh_ky/2026/10/9408506a01984585bb7a4cc21ffe4f12.pdf	e6f22c660146fba531bf237199131ca9cee21608666aa4305be15a8ecaac37af	YEU_CAU_SUA	Mục 3 thiếu bảng chi phí theo từng hạng mục.	Dữ liệu mẫu:20261024025821761319:M06:gui	2026-10-18 06:58:22.898635+07	\N	\N	\N			\N		2026-10-18 06:58:22.898635+07	2026-10-24 09:58:22.916978+07	6	\N	\N
23	25	1	1	trinh_ky/2026/10/8b1aca0b06214151a2ce1efaa679d715.pdf	399310134cc6608f6071240c6951098b1cb54489dbd97e29fdd607a0a195184c	HOAN_THANH		Dữ liệu mẫu:20261024025821761319:M04:gui	2026-10-23 06:58:22.458724+07	2026-10-24 09:58:22.494571+07	\N	\N	hoan_tat/2026/10/fd58cd213005462b9cbd3561a1be3015.pdf	4430451da4ec11093f7c011226923d734713865791bb14e86bc1a15ed2459f41	THANH_CONG		2026-10-23 06:58:22.458724+07	2026-10-24 09:58:22.707701+07	6	\N	\N
24	26	1	1	trinh_ky/2026/10/9247c97132454fea9c54ef77d274bafb.pdf	c14bb7d4d523d2e39f3dd6ede12a723fdc8db9f2bd7a5eb450c4528d3d1f5f75	TU_CHOI	Chưa đủ căn cứ pháp lý về chi phí thuê ngoài	Dữ liệu mẫu:20261024025821761319:M05:gui	2026-10-21 06:58:22.787995+07	\N	2026-10-24 09:58:22.822024+07	\N			\N		2026-10-21 06:58:22.787995+07	2026-10-24 09:58:22.822024+07	6	\N	\N
28	30	1	1	trinh_ky/2026/10/567dc635717741618c1d471ab45219e7.pdf	814fd24aa1cb97d2310013e588209f24698af70f65257314a1388b5b7f04b8eb	HUY		Dữ liệu mẫu:20261024025821761319:M08:gui	2026-10-19 06:58:23.151489+07	\N	\N	2026-10-24 09:58:23.163173+07			\N		2026-10-19 06:58:23.151489+07	2026-10-24 09:58:23.165137+07	6	\N	6
26	29	1	1	trinh_ky/2026/10/8a7b9826ed1b447685c9dcf6791edf33.pdf	06a2a440a104dfe9117bca2c5f2a2ccf2d4465313183d60bf9b4d992ab757b4c	YEU_CAU_SUA	Căn cứ pháp lý dẫn chiếu văn bản đã hết hiệu lực.	Dữ liệu mẫu:20261024025821761319:M07:gui	2026-10-17 06:58:23.00124+07	\N	\N	\N			\N		2026-10-17 06:58:23.00124+07	2026-10-24 09:58:23.01793+07	6	\N	\N
27	29	2	2	trinh_ky/2026/10/3914e52606ea40399e92b5b30f48df0e.pdf	83d3d38bdae47aa507a323af69e8bdcdb6323ef0f44d7eb429efb8b84b553d3e	CHO_KY		Dữ liệu mẫu:20261024025821761319:M07:giai-quyet	2026-10-24 09:58:23.054322+07	\N	\N	\N			\N		2026-10-24 09:58:23.057932+07	2026-10-24 09:58:23.057932+07	6	26	\N
29	31	1	1	trinh_ky/2026/10/ecaaab377d9e40a5904f34bec796b2f1.pdf	488b18bdbd8b1230283b85a7a016ee6c30699193893abd1a40ed2d86c98f2f16	CHO_KY		Dữ liệu mẫu:20261024025821761319:M09:gui	2026-10-16 06:58:23.218201+07	\N	\N	\N			\N		2026-10-16 06:58:23.218201+07	2026-10-24 09:58:23.218201+07	6	\N	\N
30	32	1	1	trinh_ky/2026/10/078a48fc4ee344f388a9e39a442c5437.pdf	6f2fe7ab1211fa8d272080e1ab5fb38bb3d57858900c1f1c46e0d7be693c39c7	CHO_KY		Dữ liệu mẫu:20261024025821761319:M10:gui	2026-10-24 06:58:23.27435+07	\N	\N	\N			\N		2026-10-24 06:58:23.27435+07	2026-10-24 09:58:23.27435+07	6	\N	\N
\.


--
-- Data for Name: signing_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_audit_log (id, trinh_ky_id, luot_trinh_id, buoc_ky_id, loai_doi_tuong, ma_doi_tuong, nguoi_thuc_hien_id, hanh_dong, trang_thai_truoc, trang_thai_sau, chi_tiet, du_lieu_kem_theo, dia_chi_ip, created_at) FROM stdin;
1	\N	\N	\N	signing_process	4	1	TAO_QUY_TRINH		NHAP		\N	\N	2026-10-24 09:58:21.8971+07
2	\N	\N	\N	signing_process	4	1	KICH_HOAT_QUY_TRINH	NHAP	HOAT_DONG		\N	\N	2026-10-24 09:58:21.899606+07
3	\N	\N	\N	signing_process	5	1	TAO_QUY_TRINH		NHAP		\N	\N	2026-10-24 09:58:21.91317+07
4	\N	\N	\N	signing_process	5	1	KICH_HOAT_QUY_TRINH	NHAP	HOAT_DONG		\N	\N	2026-10-24 09:58:21.91317+07
5	\N	\N	\N	signing_process	6	1	TAO_QUY_TRINH		NHAP		\N	\N	2026-10-24 09:58:21.924639+07
6	\N	\N	\N	signing_process	6	1	KICH_HOAT_QUY_TRINH	NHAP	HOAT_DONG		\N	\N	2026-10-24 09:58:21.924639+07
7	\N	\N	\N	signing_process	7	1	TAO_QUY_TRINH		NHAP		\N	\N	2026-10-24 09:58:21.929431+07
8	\N	\N	\N	signing_key	1	8	DANG_KY_KHOA		CHO_KICH_HOAT		\N	\N	2026-10-24 09:58:21.945219+07
9	\N	\N	\N	signing_key	1	8	XAC_MINH_SO_HUU_KHOA	CHO_KICH_HOAT	CHO_KICH_HOAT		\N	\N	2026-10-24 09:58:21.949556+07
10	\N	\N	\N	signing_key	1	8	KICH_HOAT_KHOA	CHO_KICH_HOAT	HOAT_DONG		\N	\N	2026-10-24 09:58:21.952894+07
11	\N	\N	\N	signing_key	2	9	DANG_KY_KHOA		CHO_KICH_HOAT		\N	\N	2026-10-24 09:58:21.952894+07
12	\N	\N	\N	signing_key	2	9	XAC_MINH_SO_HUU_KHOA	CHO_KICH_HOAT	CHO_KICH_HOAT		\N	\N	2026-10-24 09:58:21.952894+07
13	\N	\N	\N	signing_key	2	9	KICH_HOAT_KHOA	CHO_KICH_HOAT	HOAT_DONG		\N	\N	2026-10-24 09:58:21.952894+07
14	\N	\N	\N	signing_key	3	1	DANG_KY_KHOA		CHO_KICH_HOAT		\N	\N	2026-10-24 09:58:21.959722+07
15	\N	\N	\N	signing_key	3	1	XAC_MINH_SO_HUU_KHOA	CHO_KICH_HOAT	CHO_KICH_HOAT		\N	\N	2026-10-24 09:58:21.961238+07
16	\N	\N	\N	signing_key	3	1	KICH_HOAT_KHOA	CHO_KICH_HOAT	HOAT_DONG		\N	\N	2026-10-24 09:58:21.961238+07
17	22	\N	\N	signing_request	22	7	TAO_TRINH_KY		NHAP		{"quy_trinh": 4, "ma_bam_tai_lieu": "b696c56876f5f51bb34159c5f3fcc04c8deac56e5568410cf1bd416efe806b3f"}	\N	2026-10-24 09:58:22.239457+07
18	23	\N	\N	signing_request	23	6	TAO_TRINH_KY		NHAP		{"quy_trinh": 4, "ma_bam_tai_lieu": "69aecd9429a839b87a0dd7965d93af87dd4fd21b6a6577477cc293331e157c5a"}	\N	2026-10-24 09:58:22.269325+07
19	23	21	\N	signing_request	23	6	GUI_TRINH_KY	NHAP	CHO_KY		{"ma_bam_tai_lieu": "69aecd9429a839b87a0dd7965d93af87dd4fd21b6a6577477cc293331e157c5a", "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M02:gui"}	\N	2026-10-24 09:58:22.293403+07
20	23	21	\N	signing_attempt	21	6	MO_CAP_KY			thu_tu=1	{"cap": 21, "nguoi_ky_mo": [21]}	\N	2026-10-24 09:58:22.305253+07
21	24	\N	\N	signing_request	24	6	TAO_TRINH_KY		NHAP		{"quy_trinh": 4, "ma_bam_tai_lieu": "76a690df954662ab6bf3fbbfecde705fc2262cb55a50a3de0c8cbaf80a1560c1"}	\N	2026-10-24 09:58:22.36435+07
22	24	22	\N	signing_request	24	6	GUI_TRINH_KY	NHAP	CHO_KY		{"ma_bam_tai_lieu": "76a690df954662ab6bf3fbbfecde705fc2262cb55a50a3de0c8cbaf80a1560c1", "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M03:gui"}	\N	2026-10-24 09:58:22.375288+07
23	24	22	\N	signing_attempt	22	6	MO_CAP_KY			thu_tu=1	{"cap": 23, "nguoi_ky_mo": [23]}	\N	2026-10-24 09:58:22.380822+07
24	24	22	23	signing_request_step_signer	23	8	KY	CHO_KY	DA_KY	Đã kiểm tra số liệu, đề nghị Giám đốc phê duyệt	{"chu_ky": 1, "khoa_ky": 1, "ky_tre_han": false}	\N	2026-10-24 09:58:22.399516+07
25	24	22	\N	signing_attempt	22	8	MO_CAP_KY			thu_tu=2	{"cap": 24, "nguoi_ky_mo": [24]}	\N	2026-10-24 09:58:22.406729+07
26	25	\N	\N	signing_request	25	6	TAO_TRINH_KY		NHAP		{"quy_trinh": 5, "ma_bam_tai_lieu": "399310134cc6608f6071240c6951098b1cb54489dbd97e29fdd607a0a195184c"}	\N	2026-10-24 09:58:22.449278+07
27	25	23	\N	signing_request	25	6	GUI_TRINH_KY	NHAP	CHO_KY		{"ma_bam_tai_lieu": "399310134cc6608f6071240c6951098b1cb54489dbd97e29fdd607a0a195184c", "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M04:gui"}	\N	2026-10-24 09:58:22.463175+07
28	25	23	\N	signing_attempt	23	6	MO_CAP_KY			thu_tu=1	{"cap": 25, "nguoi_ky_mo": [25]}	\N	2026-10-24 09:58:22.469399+07
29	25	23	25	signing_request_step_signer	25	8	KY	CHO_KY	DA_KY	Thể thức đúng quy định	{"chu_ky": 2, "khoa_ky": 1, "ky_tre_han": false}	\N	2026-10-24 09:58:22.480471+07
30	25	23	26	signing_request_step_signer	26	9	KY	CHO_KY	DA_KY		{"chu_ky": 3, "khoa_ky": 2, "ky_tre_han": false}	\N	2026-10-24 09:58:22.49757+07
31	25	23	\N	signing_request	25	9	HOAN_THANH_TRINH_KY	CHO_KY	HOAN_THANH		\N	\N	2026-10-24 09:58:22.501928+07
32	25	23	\N	signing_manifest	1	9	CHOT_BANG_CHUNG		DA_CHOT		{"ma_bam_bang_chung": "9458d402a0c207d26424af6b26a99027514f1bb66ffccecd907d95b5f2acbd15"}	\N	2026-10-24 09:58:22.510472+07
33	25	23	\N	signing_attempt	23	9	TAO_TEP_HOAN_TAT	DANG_XU_LY	THANH_CONG		{"ma_bam_tep_hoan_tat": "4430451da4ec11093f7c011226923d734713865791bb14e86bc1a15ed2459f41"}	\N	2026-10-24 09:58:22.709698+07
34	26	\N	\N	signing_request	26	6	TAO_TRINH_KY		NHAP		{"quy_trinh": 4, "ma_bam_tai_lieu": "c14bb7d4d523d2e39f3dd6ede12a723fdc8db9f2bd7a5eb450c4528d3d1f5f75"}	\N	2026-10-24 09:58:22.780652+07
35	26	24	\N	signing_request	26	6	GUI_TRINH_KY	NHAP	CHO_KY		{"ma_bam_tai_lieu": "c14bb7d4d523d2e39f3dd6ede12a723fdc8db9f2bd7a5eb450c4528d3d1f5f75", "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M05:gui"}	\N	2026-10-24 09:58:22.792578+07
36	26	24	\N	signing_attempt	24	6	MO_CAP_KY			thu_tu=1	{"cap": 26, "nguoi_ky_mo": [27]}	\N	2026-10-24 09:58:22.796578+07
37	26	24	27	signing_request_step_signer	27	8	KY	CHO_KY	DA_KY		{"chu_ky": 4, "khoa_ky": 1, "ky_tre_han": false}	\N	2026-10-24 09:58:22.809616+07
38	26	24	\N	signing_attempt	24	8	MO_CAP_KY			thu_tu=2	{"cap": 27, "nguoi_ky_mo": [28]}	\N	2026-10-24 09:58:22.815251+07
39	26	24	28	signing_request_step_signer	28	9	TU_CHOI	CHO_KY	TU_CHOI	Chưa đủ căn cứ pháp lý về chi phí thuê ngoài	\N	\N	2026-10-24 09:58:22.823993+07
40	26	\N	\N	signing_request	26	6	TRINH_LAI				{"ho_so_moi": 27, "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M05:trinh-lai"}	\N	2026-10-24 09:58:22.836997+07
41	27	\N	\N	signing_request	27	6	TAO_TRINH_KY		NHAP		{"ho_so_goc": 26, "quy_trinh": 4}	\N	2026-10-24 09:58:22.837997+07
42	28	\N	\N	signing_request	28	6	TAO_TRINH_KY		NHAP		{"quy_trinh": 4, "ma_bam_tai_lieu": "e6f22c660146fba531bf237199131ca9cee21608666aa4305be15a8ecaac37af"}	\N	2026-10-24 09:58:22.892581+07
43	28	25	\N	signing_request	28	6	GUI_TRINH_KY	NHAP	CHO_KY		{"ma_bam_tai_lieu": "e6f22c660146fba531bf237199131ca9cee21608666aa4305be15a8ecaac37af", "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M06:gui"}	\N	2026-10-24 09:58:22.903475+07
44	28	25	\N	signing_attempt	25	6	MO_CAP_KY			thu_tu=1	{"cap": 28, "nguoi_ky_mo": [29]}	\N	2026-10-24 09:58:22.907425+07
45	28	25	29	signing_request_step_signer	29	8	YEU_CAU_SUA	CHO_KY	YEU_CAU_SUA	Bổ sung bảng dự toán chi tiết	{"thread": 1}	\N	2026-10-24 09:58:22.922793+07
46	29	\N	\N	signing_request	29	6	TAO_TRINH_KY		NHAP		{"quy_trinh": 4, "ma_bam_tai_lieu": "06a2a440a104dfe9117bca2c5f2a2ccf2d4465313183d60bf9b4d992ab757b4c"}	\N	2026-10-24 09:58:22.994382+07
47	29	26	\N	signing_request	29	6	GUI_TRINH_KY	NHAP	CHO_KY		{"ma_bam_tai_lieu": "06a2a440a104dfe9117bca2c5f2a2ccf2d4465313183d60bf9b4d992ab757b4c", "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M07:gui"}	\N	2026-10-24 09:58:23.005237+07
48	29	26	\N	signing_attempt	26	6	MO_CAP_KY			thu_tu=1	{"cap": 30, "nguoi_ky_mo": [31]}	\N	2026-10-24 09:58:23.009741+07
49	29	26	31	signing_request_step_signer	31	8	YEU_CAU_SUA	CHO_KY	YEU_CAU_SUA	Sửa căn cứ ban hành	{"thread": 2}	\N	2026-10-24 09:58:23.020451+07
50	29	27	\N	signing_request	29	6	GIAI_QUYET_YEU_CAU_SUA	YEU_CAU_SUA	CHO_KY		{"thread": 2, "luot_truoc": 26, "ma_bam_tai_lieu": "83d3d38bdae47aa507a323af69e8bdcdb6323ef0f44d7eb429efb8b84b553d3e"}	\N	2026-10-24 09:58:23.06054+07
51	29	27	\N	signing_attempt	27	6	MO_CAP_KY			thu_tu=1	{"cap": 32, "nguoi_ky_mo": [33]}	\N	2026-10-24 09:58:23.065541+07
52	29	27	33	signing_request_step_signer	33	8	KY	CHO_KY	DA_KY	Đã sửa đúng yêu cầu	{"chu_ky": 5, "khoa_ky": 1, "ky_tre_han": false}	\N	2026-10-24 09:58:23.075508+07
53	29	27	\N	signing_attempt	27	8	MO_CAP_KY			thu_tu=2	{"cap": 33, "nguoi_ky_mo": [34]}	\N	2026-10-24 09:58:23.08202+07
54	30	\N	\N	signing_request	30	6	TAO_TRINH_KY		NHAP		{"quy_trinh": 4, "ma_bam_tai_lieu": "814fd24aa1cb97d2310013e588209f24698af70f65257314a1388b5b7f04b8eb"}	\N	2026-10-24 09:58:23.144087+07
55	30	28	\N	signing_request	30	6	GUI_TRINH_KY	NHAP	CHO_KY		{"ma_bam_tai_lieu": "814fd24aa1cb97d2310013e588209f24698af70f65257314a1388b5b7f04b8eb", "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M08:gui"}	\N	2026-10-24 09:58:23.154474+07
56	30	28	\N	signing_attempt	28	6	MO_CAP_KY			thu_tu=1	{"cap": 34, "nguoi_ky_mo": [35]}	\N	2026-10-24 09:58:23.158632+07
57	30	28	\N	signing_request	30	6	HUY_TRINH_KY	CHO_KY	HUY	Lịch bảo trì thay đổi, không cần ban hành	{"huy_thay": false, "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M08:huy"}	\N	2026-10-24 09:58:23.166749+07
58	31	\N	\N	signing_request	31	6	TAO_TRINH_KY		NHAP		{"quy_trinh": 4, "ma_bam_tai_lieu": "488b18bdbd8b1230283b85a7a016ee6c30699193893abd1a40ed2d86c98f2f16"}	\N	2026-10-24 09:58:23.211614+07
59	31	29	\N	signing_request	31	6	GUI_TRINH_KY	NHAP	CHO_KY		{"ma_bam_tai_lieu": "488b18bdbd8b1230283b85a7a016ee6c30699193893abd1a40ed2d86c98f2f16", "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M09:gui"}	\N	2026-10-24 09:58:23.222721+07
60	31	29	\N	signing_attempt	29	6	MO_CAP_KY			thu_tu=1	{"cap": 36, "nguoi_ky_mo": [37]}	\N	2026-10-24 09:58:23.225161+07
61	32	\N	\N	signing_request	32	6	TAO_TRINH_KY		NHAP		{"quy_trinh": 6, "ma_bam_tai_lieu": "6f2fe7ab1211fa8d272080e1ab5fb38bb3d57858900c1f1c46e0d7be693c39c7"}	\N	2026-10-24 09:58:23.266435+07
62	32	30	\N	signing_request	32	6	GUI_TRINH_KY	NHAP	CHO_KY		{"ma_bam_tai_lieu": "6f2fe7ab1211fa8d272080e1ab5fb38bb3d57858900c1f1c46e0d7be693c39c7", "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M10:gui"}	\N	2026-10-24 09:58:23.279337+07
63	32	30	\N	signing_attempt	30	6	MO_CAP_KY			thu_tu=1	{"cap": 38, "nguoi_ky_mo": [39, 40]}	\N	2026-10-24 09:58:23.286497+07
64	32	30	40	signing_request_step_signer	40	1	KY	CHO_KY	DA_KY	Đồng ý về mặt kỹ thuật	{"chu_ky": 6, "khoa_ky": 3, "ky_tre_han": false}	\N	2026-10-24 09:58:23.297976+07
65	32	30	39	signing_request_step_signer	39	1	UY_QUYEN_KY			Trưởng Phòng → Giám Đốc: Trưởng phòng nghỉ phép đến hết tuần	{"tu": 8, "den": 9, "khoa_chong_trung": "Dữ liệu mẫu:20261024025821761319:M10:uy-quyen"}	\N	2026-10-24 09:58:23.318059+07
66	\N	\N	\N	signing_key	1	8	THU_HOI_KHOA	HOAT_DONG	THU_HOI	Dữ liệu mẫu: thu hồi khóa tạm sau khi ký mẫu	\N	\N	2026-10-24 09:58:23.351496+07
67	\N	\N	\N	signing_key	2	9	THU_HOI_KHOA	HOAT_DONG	THU_HOI	Dữ liệu mẫu: thu hồi khóa tạm sau khi ký mẫu	\N	\N	2026-10-24 09:58:23.353607+07
68	\N	\N	\N	signing_key	3	1	THU_HOI_KHOA	HOAT_DONG	THU_HOI	Dữ liệu mẫu: thu hồi khóa tạm sau khi ký mẫu	\N	\N	2026-10-24 09:58:23.355606+07
\.


--
-- Data for Name: signing_change_message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_change_message (id, yeu_cau_sua_id, nguoi_viet_id, noi_dung, created_at) FROM stdin;
1	1	6	Đã nhận, sẽ bổ sung bảng chi phí trong hôm nay.	2026-10-24 09:58:22.927872+07
2	1	8	Ghi rõ đơn giá và nguồn báo giá.	2026-10-24 09:58:22.936645+07
3	2	6	Đã cập nhật căn cứ theo văn bản mới.	2026-10-24 09:58:23.024534+07
\.


--
-- Data for Name: signing_change_thread; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_change_thread (id, luot_trinh_id, nguoi_yeu_cau_id, tieu_de, ly_do, trang_thai, thoi_diem_giai_quyet, created_at, updated_at) FROM stdin;
1	25	8	Bổ sung bảng dự toán chi tiết	Mục 3 thiếu bảng chi phí theo từng hạng mục.	DANG_MO	\N	2026-10-24 09:58:22.918181+07	2026-10-24 09:58:22.918181+07
2	26	8	Sửa căn cứ ban hành	Căn cứ pháp lý dẫn chiếu văn bản đã hết hiệu lực.	DA_GIAI_QUYET	2026-10-24 09:58:23.054322+07	2026-10-24 09:58:23.01944+07	2026-10-24 09:58:23.056917+07
\.


--
-- Data for Name: signing_key; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_key (id, nguoi_so_huu_id, ma_khoa, dau_van_tay, thuat_toan, khoa_cong_khai, trang_thai, thoi_diem_xac_minh_so_huu, thoi_diem_kich_hoat, ngay_hieu_luc, ngay_het_han, ngay_thu_hoi, ghi_chu, created_at, khoa_thay_the_id) FROM stdin;
1	8	DLM-truongphong-20261024025821939741	e37bc7f3502b42261ac5c5f30dc86ab0135b46ffe2dd978338fa784e9b68d0a3	Ed25519	fULIQhIEetXZJVfBdK82A1JkrnK1r9B1Kpv0WBt72lE=	THU_HOI	2026-10-24 09:58:21.945219+07	2026-10-24 09:58:21.949556+07	2026-10-24 09:57:21.939741+07	\N	2026-10-24 09:58:23.350946+07	Dữ liệu mẫu: khóa tạm	2026-10-24 09:58:21.939741+07	\N
2	9	DLM-giamdoc-20261024025821952894	6e5a8c027740a7451c53703675ede72795f6e5f1ffd2213f2727a44e2f91bc9a	Ed25519	K0WKcXMYpgOqNNQMyF5iyc3Xox4Z3cJZ6nGxYXbD+Wo=	THU_HOI	2026-10-24 09:58:21.952894+07	2026-10-24 09:58:21.952894+07	2026-10-24 09:57:21.952894+07	\N	2026-10-24 09:58:23.353088+07	Dữ liệu mẫu: khóa tạm	2026-10-24 09:58:21.952894+07	\N
3	1	DLM-admin-20261024025821959722	d9056f16a471d9fe3cc8cadf3904663c5af921f4eb0bcc8d02025488e3b74258	Ed25519	l5M4KizADJjjwfdTR2lmoHO7hUncJGoh136Mma8SDp8=	THU_HOI	2026-10-24 09:58:21.961238+07	2026-10-24 09:58:21.961238+07	2026-10-24 09:57:21.959722+07	\N	2026-10-24 09:58:23.354638+07	Dữ liệu mẫu: khóa tạm	2026-10-24 09:58:21.959722+07	\N
\.


--
-- Data for Name: signing_key_unlock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_key_unlock (id, khoa_id, ma_bam_xac_minh_pin, manh_bi_mat_ma_hoa, tham_so_kdf, so_lan_sai, khoa_den, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: signing_manifest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_manifest (id, luot_trinh_id, phien_ban_bang_chung, noi_dung_chuan_hoa, ma_bam_bang_chung, vi_tri_luu, trang_thai, thoi_diem_chot, created_at, nguoi_tao_id) FROM stdin;
1	23	2	{"ho_so": {"id": 25, "van_ban": {"so_hieu": "104/BC-CNTT", "trich_yeu": "Báo cáo tổng kết công tác an toàn thông tin quý III"}, "ho_so_goc": null, "nguoi_tao": {"id": 6, "ten": "Văn Thư"}, "quy_trinh": {"id": 5, "ma": "QT-TK-KY-NHAY", "ten": "Duyệt có ký nháy", "phien_ban": 1}, "van_ban_id": 42, "document_type": "vanbandi"}, "cap_ky": [{"cap_ky": 1, "thu_tu": 1, "nguoi_ky": [{"id": 25, "chu_ky": {"id": 2, "khoa_ky": 1, "ma_khoa": "DLM-truongphong-20261024025821939741", "ngay_ky": "2026-10-24T02:58:22.477958Z", "chu_ky_so": "S27A/o4xpUptHXXYGaL2RXXMZDNu9Ik0R9acY2GWI55fz6oLCJ/cicVYaiHevxo40t6pZfQR3iXIql/6OoODAw==", "ghi_chu_ky": "Thể thức đúng quy định", "ky_tre_han": false, "thuat_toan": "Ed25519", "so_giay_tre": null, "hash_tai_lieu": "399310134cc6608f6071240c6951098b1cb54489dbd97e29fdd607a0a195184c", "khoa_cong_khai": "fULIQhIEetXZJVfBdK82A1JkrnK1r9B1Kpv0WBt72lE=", "dau_van_tay_khoa": "e37bc7f3502b42261ac5c5f30dc86ab0135b46ffe2dd978338fa784e9b68d0a3", "ma_bam_anh_chu_ky": null}, "vi_tri": null, "nguoi_ky": 8, "vai_tro_ky": "KY_NHAY", "ten_chuc_vu": "Trưởng phòng", "ten_nguoi_ky": "Trưởng Phòng"}, {"id": 26, "chu_ky": {"id": 3, "khoa_ky": 2, "ma_khoa": "DLM-giamdoc-20261024025821952894", "ngay_ky": "2026-10-24T02:58:22.494571Z", "chu_ky_so": "Xj+l204y7YGOiuBxqiq9/thTMD5T3cyQNVGdUw9Yx7JAl0WMct0fSC8qyE2RiegiuX2xYHNxkN5nslLEwcvmBw==", "ghi_chu_ky": "", "ky_tre_han": false, "thuat_toan": "Ed25519", "so_giay_tre": null, "hash_tai_lieu": "399310134cc6608f6071240c6951098b1cb54489dbd97e29fdd607a0a195184c", "khoa_cong_khai": "K0WKcXMYpgOqNNQMyF5iyc3Xox4Z3cJZ6nGxYXbD+Wo=", "dau_van_tay_khoa": "6e5a8c027740a7451c53703675ede72795f6e5f1ffd2213f2727a44e2f91bc9a", "ma_bam_anh_chu_ky": null}, "vi_tri": null, "nguoi_ky": 9, "vai_tro_ky": "KY_CHINH", "ten_chuc_vu": "Lãnh đạo cơ quan", "ten_nguoi_ky": "Giám Đốc"}], "han_xu_ly": "2026-10-26T02:58:22.458724Z", "ten_cap_ky": "Kiểm tra và phê duyệt", "thoi_diem_mo": "2026-10-24T02:58:22.458724Z", "thoi_diem_hoan_thanh": "2026-10-24T02:58:22.494571Z"}], "nhan_dien": "BẢN DUYỆT NỘI BỘ, CHƯA PHÁT HÀNH", "phien_ban": 2, "luot_trinh": {"id": 23, "so_luot": 1, "luot_truoc": null, "thoi_diem_gui": "2026-10-22T23:58:22.458724Z", "thuat_toan_bam": "SHA-256", "ma_bam_tai_lieu": "399310134cc6608f6071240c6951098b1cb54489dbd97e29fdd607a0a195184c", "phien_ban_van_ban": "1", "thoi_diem_hoan_thanh": "2026-10-24T02:58:22.494571Z"}}	9458d402a0c207d26424af6b26a99027514f1bb66ffccecd907d95b5f2acbd15	\N	DA_CHOT	2026-10-24 09:58:22.494571+07	2026-10-24 09:58:22.506958+07	9
\.


--
-- Data for Name: signing_notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_notification (id, trinh_ky_id, buoc_ky_id, nguoi_nhan_id, kenh, loai_thong_bao, trang_thai, hen_gio_gui, khoa_chong_gui_trung, so_lan_gui_lai, thoi_diem_gui, loi_gui, created_at) FROM stdin;
1	23	21	8	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:21:1792810702.281578:IN_APP	0	2026-10-24 09:58:22.298404+07		2026-10-24 09:58:22.299405+07
2	23	21	8	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:21:1792810702.281578:EMAIL	0	2026-10-24 09:58:22.319324+07		2026-10-24 09:58:22.304254+07
3	24	23	8	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:23:1792810702.371289:IN_APP	0	2026-10-24 09:58:22.379289+07		2026-10-24 09:58:22.379289+07
5	24	24	9	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:24:1792810702.391900:IN_APP	0	2026-10-24 09:58:22.404729+07		2026-10-24 09:58:22.404729+07
4	24	23	8	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:23:1792810702.371289:EMAIL	0	2026-10-24 09:58:22.413402+07		2026-10-24 09:58:22.379289+07
6	24	24	9	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:24:1792810702.391900:EMAIL	0	2026-10-24 09:58:22.419698+07		2026-10-24 09:58:22.405729+07
7	25	25	8	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:25:1792810702.458724:IN_APP	0	2026-10-24 09:58:22.467175+07		2026-10-24 09:58:22.467175+07
9	25	26	9	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:26:1792810702.477958:IN_APP	0	2026-10-24 09:58:22.486004+07		2026-10-24 09:58:22.486004+07
11	25	\N	6	IN_APP	HOAN_THANH	DA_GUI	\N	HOAN_THANH:25:23:6:IN_APP	0	2026-10-24 09:58:22.513507+07		2026-10-24 09:58:22.513507+07
13	25	\N	8	IN_APP	HOAN_THANH	DA_GUI	\N	HOAN_THANH:25:23:8:IN_APP	0	2026-10-24 09:58:22.514471+07		2026-10-24 09:58:22.51547+07
8	25	25	8	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:25:1792810702.458724:EMAIL	0	2026-10-24 09:58:22.522565+07		2026-10-24 09:58:22.468399+07
10	25	26	9	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:26:1792810702.477958:EMAIL	0	2026-10-24 09:58:22.529048+07		2026-10-24 09:58:22.487004+07
12	25	\N	6	EMAIL	HOAN_THANH	DA_GUI	\N	HOAN_THANH:25:23:6:EMAIL	0	2026-10-24 09:58:22.715333+07		2026-10-24 09:58:22.514471+07
14	25	\N	8	EMAIL	HOAN_THANH	DA_GUI	\N	HOAN_THANH:25:23:8:EMAIL	0	2026-10-24 09:58:22.721767+07		2026-10-24 09:58:22.51547+07
15	26	27	8	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:27:1792810702.787995:IN_APP	0	2026-10-24 09:58:22.795585+07		2026-10-24 09:58:22.795585+07
17	26	28	9	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:28:1792810702.806607:IN_APP	0	2026-10-24 09:58:22.814199+07		2026-10-24 09:58:22.814199+07
19	26	\N	6	IN_APP	TU_CHOI	DA_GUI	\N	TU_CHOI:26:24:6:IN_APP	0	2026-10-24 09:58:22.826963+07		2026-10-24 09:58:22.826963+07
21	26	\N	8	IN_APP	TU_CHOI	DA_GUI	\N	TU_CHOI:26:24:8:IN_APP	0	2026-10-24 09:58:22.827942+07		2026-10-24 09:58:22.827942+07
16	26	27	8	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:27:1792810702.787995:EMAIL	0	2026-10-24 09:58:22.843507+07		2026-10-24 09:58:22.796578+07
18	26	28	9	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:28:1792810702.806607:EMAIL	0	2026-10-24 09:58:22.849594+07		2026-10-24 09:58:22.815251+07
20	26	\N	6	EMAIL	TU_CHOI	DA_GUI	\N	TU_CHOI:26:24:6:EMAIL	0	2026-10-24 09:58:22.856107+07		2026-10-24 09:58:22.827942+07
22	26	\N	8	EMAIL	TU_CHOI	DA_GUI	\N	TU_CHOI:26:24:8:EMAIL	0	2026-10-24 09:58:22.8625+07		2026-10-24 09:58:22.827942+07
23	28	29	8	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:29:1792810702.898635:IN_APP	0	2026-10-24 09:58:22.906425+07		2026-10-24 09:58:22.906425+07
25	28	\N	6	IN_APP	YEU_CAU_SUA	DA_GUI	\N	YEU_CAU_SUA:28:25:6:IN_APP	0	2026-10-24 09:58:22.923792+07		2026-10-24 09:58:22.923792+07
27	28	\N	8	IN_APP	TIN_NHAN	DA_GUI	\N	TIN_NHAN:1:8:IN_APP	0	2026-10-24 09:58:22.93239+07		2026-10-24 09:58:22.93239+07
29	28	\N	6	IN_APP	TIN_NHAN	DA_GUI	\N	TIN_NHAN:2:6:IN_APP	0	2026-10-24 09:58:22.936645+07		2026-10-24 09:58:22.937646+07
24	28	29	8	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:29:1792810702.898635:EMAIL	0	2026-10-24 09:58:22.944259+07		2026-10-24 09:58:22.907425+07
26	28	\N	6	EMAIL	YEU_CAU_SUA	DA_GUI	\N	YEU_CAU_SUA:28:25:6:EMAIL	0	2026-10-24 09:58:22.952555+07		2026-10-24 09:58:22.924797+07
28	28	\N	8	EMAIL	TIN_NHAN	DA_GUI	\N	TIN_NHAN:1:8:EMAIL	0	2026-10-24 09:58:22.958416+07		2026-10-24 09:58:22.933389+07
30	28	\N	6	EMAIL	TIN_NHAN	DA_GUI	\N	TIN_NHAN:2:6:EMAIL	0	2026-10-24 09:58:22.964173+07		2026-10-24 09:58:22.937646+07
31	29	31	8	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:31:1792810703.001240:IN_APP	0	2026-10-24 09:58:23.008237+07		2026-10-24 09:58:23.008237+07
33	29	\N	6	IN_APP	YEU_CAU_SUA	DA_GUI	\N	YEU_CAU_SUA:29:26:6:IN_APP	0	2026-10-24 09:58:23.021453+07		2026-10-24 09:58:23.021453+07
35	29	\N	8	IN_APP	TIN_NHAN	DA_GUI	\N	TIN_NHAN:3:8:IN_APP	0	2026-10-24 09:58:23.025495+07		2026-10-24 09:58:23.025495+07
37	29	33	8	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:33:1792810703.054322:IN_APP	0	2026-10-24 09:58:23.063588+07		2026-10-24 09:58:23.064543+07
39	29	34	9	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:34:1792810703.072509:IN_APP	0	2026-10-24 09:58:23.080016+07		2026-10-24 09:58:23.080016+07
32	29	31	8	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:31:1792810703.001240:EMAIL	0	2026-10-24 09:58:23.088507+07		2026-10-24 09:58:23.009238+07
34	29	\N	6	EMAIL	YEU_CAU_SUA	DA_GUI	\N	YEU_CAU_SUA:29:26:6:EMAIL	0	2026-10-24 09:58:23.095973+07		2026-10-24 09:58:23.021453+07
36	29	\N	8	EMAIL	TIN_NHAN	DA_GUI	\N	TIN_NHAN:3:8:EMAIL	0	2026-10-24 09:58:23.103059+07		2026-10-24 09:58:23.026484+07
38	29	33	8	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:33:1792810703.054322:EMAIL	0	2026-10-24 09:58:23.109123+07		2026-10-24 09:58:23.064543+07
40	29	34	9	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:34:1792810703.072509:EMAIL	0	2026-10-24 09:58:23.115376+07		2026-10-24 09:58:23.081021+07
41	30	35	8	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:35:1792810703.151489:IN_APP	0	2026-10-24 09:58:23.157683+07		2026-10-24 09:58:23.157683+07
43	30	\N	8	IN_APP	HUY	DA_GUI	\N	HUY:30:28:8:IN_APP	0	2026-10-24 09:58:23.167879+07		2026-10-24 09:58:23.169385+07
42	30	35	8	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:35:1792810703.151489:EMAIL	0	2026-10-24 09:58:23.17539+07		2026-10-24 09:58:23.158632+07
44	30	\N	8	EMAIL	HUY	DA_GUI	\N	HUY:30:28:8:EMAIL	0	2026-10-24 09:58:23.182142+07		2026-10-24 09:58:23.169385+07
45	31	37	8	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:37:1792810703.218201:IN_APP	0	2026-10-24 09:58:23.225161+07		2026-10-24 09:58:23.225161+07
46	31	37	8	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:37:1792810703.218201:EMAIL	0	2026-10-24 09:58:23.237435+07		2026-10-24 09:58:23.225161+07
47	32	39	8	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:39:1792810703.274350:IN_APP	0	2026-10-24 09:58:23.281847+07		2026-10-24 09:58:23.281847+07
49	32	40	1	IN_APP	CAN_KY	DA_GUI	\N	CAN_KY:40:1792810703.274350:IN_APP	0	2026-10-24 09:58:23.284461+07		2026-10-24 09:58:23.284461+07
51	32	39	9	IN_APP	UY_QUYEN	DA_GUI	\N	UY_QUYEN:39:1792810703.316902:9:IN_APP	0	2026-10-24 09:58:23.319596+07		2026-10-24 09:58:23.319596+07
53	32	39	8	IN_APP	UY_QUYEN	DA_GUI	\N	UY_QUYEN:39:1792810703.316902:8:IN_APP	0	2026-10-24 09:58:23.320602+07		2026-10-24 09:58:23.320602+07
48	32	39	8	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:39:1792810703.274350:EMAIL	0	2026-10-24 09:58:23.328695+07		2026-10-24 09:58:23.283327+07
50	32	40	1	EMAIL	CAN_KY	DA_GUI	\N	CAN_KY:40:1792810703.274350:EMAIL	0	2026-10-24 09:58:23.335341+07		2026-10-24 09:58:23.285461+07
52	32	39	9	EMAIL	UY_QUYEN	DA_GUI	\N	UY_QUYEN:39:1792810703.316902:9:EMAIL	0	2026-10-24 09:58:23.341774+07		2026-10-24 09:58:23.320602+07
54	32	39	8	EMAIL	UY_QUYEN	DA_GUI	\N	UY_QUYEN:39:1792810703.316902:8:EMAIL	0	2026-10-24 09:58:23.349461+07		2026-10-24 09:58:23.321607+07
55	3	2	1	IN_APP	NHAC_HAN	DA_GUI	\N	NHAC_HAN:2:1792585551.498030:IN_APP	0	2026-10-24 09:58:23.360116+07		2026-10-24 09:58:23.360116+07
56	3	2	1	EMAIL	NHAC_HAN	DA_GUI	\N	NHAC_HAN:2:1792585551.498030:EMAIL	0	2026-10-24 09:58:23.366264+07		2026-10-24 09:58:23.360714+07
57	4	3	1	IN_APP	QUA_HAN	DA_GUI	\N	QUA_HAN:3:1792499151.514262:0:1:IN_APP	0	2026-10-24 09:58:23.367247+07		2026-10-24 09:58:23.367247+07
59	4	3	15	IN_APP	QUA_HAN	DA_GUI	\N	QUA_HAN:3:1792499151.514262:0:15:IN_APP	0	2026-10-24 09:58:23.368332+07		2026-10-24 09:58:23.368854+07
58	4	3	1	EMAIL	QUA_HAN	DA_GUI	\N	QUA_HAN:3:1792499151.514262:0:1:EMAIL	0	2026-10-24 09:58:23.373963+07		2026-10-24 09:58:23.368332+07
60	8	7	8	IN_APP	NHAC_HAN	DA_GUI	\N	NHAC_HAN:7:1792587340.555569:IN_APP	0	2026-10-24 09:58:23.375111+07		2026-10-24 09:58:23.375643+07
61	8	7	8	EMAIL	NHAC_HAN	DA_GUI	\N	NHAC_HAN:7:1792587340.555569:EMAIL	0	2026-10-24 09:58:23.381249+07		2026-10-24 09:58:23.376164+07
62	9	8	8	IN_APP	QUA_HAN	DA_GUI	\N	QUA_HAN:8:1792500940.555569:0:8:IN_APP	0	2026-10-24 09:58:23.382498+07		2026-10-24 09:58:23.383025+07
64	9	8	15	IN_APP	QUA_HAN	DA_GUI	\N	QUA_HAN:8:1792500940.555569:0:15:IN_APP	0	2026-10-24 09:58:23.384322+07		2026-10-24 09:58:23.384322+07
63	9	8	8	EMAIL	QUA_HAN	DA_GUI	\N	QUA_HAN:8:1792500940.555569:0:8:EMAIL	0	2026-10-24 09:58:23.390043+07		2026-10-24 09:58:23.383744+07
65	13	12	9	IN_APP	NHAC_HAN	DA_GUI	\N	NHAC_HAN:12:1792587343.215484:IN_APP	0	2026-10-24 09:58:23.390661+07		2026-10-24 09:58:23.391195+07
66	13	12	9	EMAIL	NHAC_HAN	DA_GUI	\N	NHAC_HAN:12:1792587343.215484:EMAIL	0	2026-10-24 09:58:23.397504+07		2026-10-24 09:58:23.391724+07
67	14	13	9	IN_APP	QUA_HAN	DA_GUI	\N	QUA_HAN:13:1792500943.223865:0:9:IN_APP	0	2026-10-24 09:58:23.398523+07		2026-10-24 09:58:23.398523+07
69	14	13	15	IN_APP	QUA_HAN	DA_GUI	\N	QUA_HAN:13:1792500943.223865:0:15:IN_APP	0	2026-10-24 09:58:23.399887+07		2026-10-24 09:58:23.399887+07
68	14	13	9	EMAIL	QUA_HAN	DA_GUI	\N	QUA_HAN:13:1792500943.223865:0:9:EMAIL	0	2026-10-24 09:58:23.405526+07		2026-10-24 09:58:23.39954+07
70	18	17	7	IN_APP	NHAC_HAN	DA_GUI	\N	NHAC_HAN:17:1792587345.884358:IN_APP	0	2026-10-24 09:58:23.406923+07		2026-10-24 09:58:23.406923+07
71	18	17	7	EMAIL	NHAC_HAN	DA_GUI	\N	NHAC_HAN:17:1792587345.884358:EMAIL	0	2026-10-24 09:58:23.413874+07		2026-10-24 09:58:23.408061+07
72	19	18	7	IN_APP	QUA_HAN	DA_GUI	\N	QUA_HAN:18:1792500945.893693:0:7:IN_APP	0	2026-10-24 09:58:23.415001+07		2026-10-24 09:58:23.415001+07
74	19	18	15	IN_APP	QUA_HAN	DA_GUI	\N	QUA_HAN:18:1792500945.893693:0:15:IN_APP	0	2026-10-24 09:58:23.416547+07		2026-10-24 09:58:23.416547+07
73	19	18	7	EMAIL	QUA_HAN	DA_GUI	\N	QUA_HAN:18:1792500945.893693:0:7:EMAIL	0	2026-10-24 09:58:23.422124+07		2026-10-24 09:58:23.416083+07
75	23	21	8	IN_APP	NHAC_HAN	DA_GUI	\N	NHAC_HAN:21:1792810702.281578:IN_APP	0	2026-10-24 09:58:23.423381+07		2026-10-24 09:58:23.423381+07
76	23	21	8	EMAIL	NHAC_HAN	DA_GUI	\N	NHAC_HAN:21:1792810702.281578:EMAIL	0	2026-10-24 09:58:23.429903+07		2026-10-24 09:58:23.424013+07
77	31	37	8	IN_APP	QUA_HAN	DA_GUI	\N	QUA_HAN:37:1792810703.218201:0:8:IN_APP	0	2026-10-24 09:58:23.430965+07		2026-10-24 09:58:23.430965+07
79	31	37	6	IN_APP	QUA_HAN	DA_GUI	\N	QUA_HAN:37:1792810703.218201:0:6:IN_APP	0	2026-10-24 09:58:23.432033+07		2026-10-24 09:58:23.432598+07
78	31	37	8	EMAIL	QUA_HAN	DA_GUI	\N	QUA_HAN:37:1792810703.218201:0:8:EMAIL	0	2026-10-24 09:58:23.438805+07		2026-10-24 09:58:23.432033+07
80	31	37	6	EMAIL	QUA_HAN	DA_GUI	\N	QUA_HAN:37:1792810703.218201:0:6:EMAIL	0	2026-10-24 09:58:23.446129+07		2026-10-24 09:58:23.433128+07
81	32	39	9	IN_APP	NHAC_HAN	DA_GUI	\N	NHAC_HAN:39:1792810703.274350:IN_APP	0	2026-10-24 09:58:23.447045+07		2026-10-24 09:58:23.447045+07
82	32	39	9	EMAIL	NHAC_HAN	DA_GUI	\N	NHAC_HAN:39:1792810703.274350:EMAIL	0	2026-10-24 09:58:23.454484+07		2026-10-24 09:58:23.448045+07
\.


--
-- Data for Name: signing_process; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_process (id, ma_quy_trinh, ten_quy_trinh, mo_ta, phien_ban, trang_thai, pham_vi, don_vi_ap_dung_id, cau_hinh_nhac_han, created_at, updated_at, nguoi_tao_id, nguoi_cap_nhat_id) FROM stdin;
3	DEMO-QT	Quy trình ký demo một cấp		1	HOAT_DONG	CONG_TY	\N	\N	2026-10-23 19:25:51.431195+07	2026-10-23 19:25:51.431195+07	14	\N
4	QT-TK-HAI-CAP	Duyệt tờ trình hai cấp	Trưởng phòng duyệt, sau đó Giám đốc duyệt.	1	HOAT_DONG	CONG_TY	\N	{"dung_han": true, "truoc_han_gio": [24]}	2026-10-24 09:58:21.889275+07	2026-10-24 09:58:21.899606+07	1	1
5	QT-TK-KY-NHAY	Duyệt có ký nháy	Trưởng phòng ký nháy kiểm tra; ký nháy xong Giám đốc mới ký chính.	1	HOAT_DONG	CONG_TY	\N	{"dung_han": true, "truoc_han_gio": [24]}	2026-10-24 09:58:21.899606+07	2026-10-24 09:58:21.91317+07	1	1
6	QT-TK-SONG-SONG	Lấy ý kiến song song	Trưởng phòng và Quản trị ký song song, sau đó Giám đốc duyệt.	1	HOAT_DONG	CONG_TY	\N	{"dung_han": true, "truoc_han_gio": [24]}	2026-10-24 09:58:21.91317+07	2026-10-24 09:58:21.924639+07	1	1
7	QT-TK-NHAP	Quy trình đang soạn	Quy trình nháp để thử sửa, kích hoạt, nhân bản.	1	NHAP	CONG_TY	\N	{"dung_han": true, "truoc_han_gio": [24]}	2026-10-24 09:58:21.929431+07	2026-10-24 09:58:21.929431+07	1	\N
\.


--
-- Data for Name: signing_process_step; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_process_step (id, quy_trinh_id, cap_ky, ten_cap_ky, thu_tu, don_vi_id, so_gio_xu_ly, dang_ap_dung, ghi_chu, created_at) FROM stdin;
3	3	1	Lãnh đạo ký duyệt	1	\N	\N	t		2026-10-23 19:25:51.431195+07
4	4	1	Trưởng phòng duyệt	1	\N	24	t		2026-10-24 09:58:21.889275+07
5	4	2	Giám đốc duyệt	2	\N	48	t		2026-10-24 09:58:21.894503+07
6	5	1	Kiểm tra và phê duyệt	1	\N	48	t		2026-10-24 09:58:21.9096+07
7	6	1	Lấy ý kiến các bộ phận	1	\N	24	t		2026-10-24 09:58:21.919524+07
8	6	2	Giám đốc duyệt	2	\N	48	t		2026-10-24 09:58:21.919524+07
9	7	1	Trưởng phòng duyệt	1	\N	\N	t		2026-10-24 09:58:21.929431+07
\.


--
-- Data for Name: signing_process_step_signer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_process_step_signer (id, buoc_quy_trinh_id, nguoi_ky_id, chuc_vu_id, pham_vi_chuc_vu, vai_tro_ky, chan_ky_chinh, thu_tu, created_at) FROM stdin;
3	3	1	\N	\N	KY_CHINH	t	1	2026-10-23 19:25:51.445458+07
4	3	8	\N	\N	KY_CHINH	t	1	2026-10-23 19:55:40.517948+07
5	3	9	\N	\N	KY_CHINH	t	1	2026-10-23 19:55:43.184678+07
6	3	7	\N	\N	KY_CHINH	t	1	2026-10-23 19:55:45.849825+07
7	4	8	\N	\N	KY_CHINH	t	1	2026-10-24 09:58:21.889275+07
8	5	9	\N	\N	KY_CHINH	t	1	2026-10-24 09:58:21.894503+07
9	6	8	\N	\N	KY_NHAY	t	1	2026-10-24 09:58:21.9096+07
10	6	9	\N	\N	KY_CHINH	t	2	2026-10-24 09:58:21.9096+07
11	7	8	\N	\N	KY_CHINH	t	1	2026-10-24 09:58:21.919524+07
12	7	1	\N	\N	KY_CHINH	t	2	2026-10-24 09:58:21.919524+07
13	8	9	\N	\N	KY_CHINH	t	1	2026-10-24 09:58:21.924639+07
14	9	8	\N	\N	KY_CHINH	t	1	2026-10-24 09:58:21.929431+07
\.


--
-- Data for Name: signing_request; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_request (id, document_type, document_id, phien_ban_van_ban, vi_tri_luu_tep, ma_bam_tai_lieu, quy_trinh_id, phien_ban_quy_trinh, trang_thai, han_chot, ngay_gui, ngay_hoan_thanh, ngay_tu_choi, ly_do_tu_choi, ngay_huy, ly_do_huy, ghi_chu, created_at, updated_at, nguoi_tao_id, nguoi_cap_nhat_id, ho_so_goc_id) FROM stdin;
2	vanbandi	8	\N	demo/DEMO-KY-1-1.pdf	ce0d9083038a6874297f422c3715a5c19adad7d98f652aa7aa7e926e5849d836	3	1	CHO_KY	2026-10-29 19:25:51.448766+07	2026-10-22 19:25:51.448766+07	\N	\N		\N			2026-10-23 19:25:51.448766+07	2026-10-23 19:25:51.448766+07	15	\N	\N
3	vanbandi	9	\N	demo/DEMO-KY-1-2.pdf	de443e17b4d1d2caad2d6e7c173253093e80f744692eaa6746c522b99f8419bb	3	1	CHO_KY	2026-10-28 19:25:51.49803+07	2026-10-21 19:25:51.49803+07	\N	\N		\N			2026-10-23 19:25:51.49803+07	2026-10-23 19:25:51.49803+07	14	\N	\N
4	vanbandi	10	\N	demo/DEMO-KY-1-3.pdf	f101acb7e44ae85f05083abeade1c24c5f5152ab3bd611acfb443d84d3789ccd	3	1	CHO_KY	2026-10-27 19:25:51.514262+07	2026-10-20 19:25:51.514262+07	\N	\N		\N			2026-10-23 19:25:51.515044+07	2026-10-23 19:25:51.515044+07	15	\N	\N
5	vanbandi	11	\N	demo/DEMO-KY-1-4.pdf	107a8b40b2e14c8ea89a333322b467f6cf90dcaa84c01796e8757b797ed7f753	3	1	HOAN_THANH	2026-10-25 19:25:51.515044+07	2026-10-18 19:25:51.515044+07	2026-10-18 23:25:51.515044+07	\N		\N			2026-10-23 19:25:51.515044+07	2026-10-23 19:25:51.515044+07	14	\N	\N
6	vanbandi	12	\N	demo/DEMO-KY-1-5.pdf	c56a56827443d4d9a79810534fc4ccb77bd954c43ba109c17e4484a2aeb24d50	3	1	TU_CHOI	2026-10-24 19:25:51.525935+07	2026-10-17 19:25:51.525935+07	\N	2026-10-17 23:25:51.525935+07	Nội dung chưa phù hợp, đề nghị rà soát lại.	\N			2026-10-23 19:25:51.528403+07	2026-10-23 19:25:51.528403+07	15	\N	\N
7	vanbandi	13	\N	demo/DEMO-KY-8-1.pdf	268de94a48810390c8032a9f0e07eb4eaeb1179ab6e8a6b3b60461af1f38accd	3	1	CHO_KY	2026-10-29 19:55:40.525786+07	2026-10-22 19:55:40.525786+07	\N	\N		\N			2026-10-23 19:55:40.525786+07	2026-10-23 19:55:40.525786+07	15	\N	\N
8	vanbandi	14	\N	demo/DEMO-KY-8-2.pdf	4eb4627ac4258986c5ebeb428dc80c915f687a613d533ac5951866be0ba22939	3	1	CHO_KY	2026-10-28 19:55:40.555569+07	2026-10-21 19:55:40.555569+07	\N	\N		\N			2026-10-23 19:55:40.555569+07	2026-10-23 19:55:40.555569+07	14	\N	\N
9	vanbandi	15	\N	demo/DEMO-KY-8-3.pdf	40f548b156ae65258bb391b97f0f7d56d98555fa90aedc1b4d7868f8fbd24207	3	1	CHO_KY	2026-10-27 19:55:40.555569+07	2026-10-20 19:55:40.555569+07	\N	\N		\N			2026-10-23 19:55:40.565879+07	2026-10-23 19:55:40.565879+07	15	\N	\N
10	vanbandi	16	\N	demo/DEMO-KY-8-4.pdf	c545c746c72352249f84a8a3de4dc1539f1e5deef434991b7822ae90c3eef6ca	3	1	HOAN_THANH	2026-10-25 19:55:40.57167+07	2026-10-18 19:55:40.57167+07	2026-10-18 23:55:40.57167+07	\N		\N			2026-10-23 19:55:40.57167+07	2026-10-23 19:55:40.57167+07	14	\N	\N
11	vanbandi	17	\N	demo/DEMO-KY-8-5.pdf	f50f63ef2a614e7e33c1ee24a6a9c7cae9302c5446de0e1de602bd6011903dfa	3	1	TU_CHOI	2026-10-24 19:55:40.578245+07	2026-10-17 19:55:40.578245+07	\N	2026-10-17 23:55:40.578245+07	Nội dung chưa phù hợp, đề nghị rà soát lại.	\N			2026-10-23 19:55:40.581966+07	2026-10-23 19:55:40.581966+07	15	\N	\N
12	vanbandi	18	\N	demo/DEMO-KY-9-1.pdf	dfff2638a4f65085b4d0a152fe7d084600cee88941f2465e26b96c9b1e2f906c	3	1	CHO_KY	2026-10-29 19:55:43.19065+07	2026-10-22 19:55:43.19065+07	\N	\N		\N			2026-10-23 19:55:43.19065+07	2026-10-23 19:55:43.19065+07	15	\N	\N
13	vanbandi	19	\N	demo/DEMO-KY-9-2.pdf	e1ee9ef2718dd24ee5a422b43d76358c63f5e1fd262a8d7074c3416d2baf3f15	3	1	CHO_KY	2026-10-28 19:55:43.215484+07	2026-10-21 19:55:43.215484+07	\N	\N		\N			2026-10-23 19:55:43.215484+07	2026-10-23 19:55:43.215484+07	14	\N	\N
14	vanbandi	20	\N	demo/DEMO-KY-9-3.pdf	0783573d98a0f26229a3bacc823d762b8cc70583054471b2acba6fd7c3b5043a	3	1	CHO_KY	2026-10-27 19:55:43.223865+07	2026-10-20 19:55:43.223865+07	\N	\N		\N			2026-10-23 19:55:43.223865+07	2026-10-23 19:55:43.223865+07	15	\N	\N
15	vanbandi	21	\N	demo/DEMO-KY-9-4.pdf	7bfc90a5668c33ad4ba9450925cfc92ddee53f28454666759b82bce0305f59bc	3	1	HOAN_THANH	2026-10-25 19:55:43.22908+07	2026-10-18 19:55:43.22908+07	2026-10-18 23:55:43.22908+07	\N		\N			2026-10-23 19:55:43.22908+07	2026-10-23 19:55:43.22908+07	14	\N	\N
16	vanbandi	22	\N	demo/DEMO-KY-9-5.pdf	10304e6f0c2c48158c3d9a361c8d5b71385ae801393ef665a087195ce9ac39d5	3	1	TU_CHOI	2026-10-24 19:55:43.234897+07	2026-10-17 19:55:43.234897+07	\N	2026-10-17 23:55:43.234897+07	Nội dung chưa phù hợp, đề nghị rà soát lại.	\N			2026-10-23 19:55:43.238284+07	2026-10-23 19:55:43.238284+07	15	\N	\N
17	vanbandi	23	\N	demo/DEMO-KY-7-1.pdf	cc84e062dc1b3344677df703aa87dac5b80932729a84fa502df0fb4fc3ace51c	3	1	CHO_KY	2026-10-29 19:55:45.856152+07	2026-10-22 19:55:45.856152+07	\N	\N		\N			2026-10-23 19:55:45.860938+07	2026-10-23 19:55:45.860938+07	15	\N	\N
18	vanbandi	24	\N	demo/DEMO-KY-7-2.pdf	21246441e79a88b2325c055874743d64ea3beddd0670460d9d34d54fe8c25ce5	3	1	CHO_KY	2026-10-28 19:55:45.884358+07	2026-10-21 19:55:45.884358+07	\N	\N		\N			2026-10-23 19:55:45.889149+07	2026-10-23 19:55:45.889149+07	14	\N	\N
19	vanbandi	25	\N	demo/DEMO-KY-7-3.pdf	dbbac8bc0639be0a7e8d3c625ba9ff02511b251584630fe191acf1f0e45d127d	3	1	CHO_KY	2026-10-27 19:55:45.893693+07	2026-10-20 19:55:45.893693+07	\N	\N		\N			2026-10-23 19:55:45.896253+07	2026-10-23 19:55:45.896253+07	15	\N	\N
20	vanbandi	26	\N	demo/DEMO-KY-7-4.pdf	b0c7655966a66126e534d758d52495536f2ab8957627a01b1df5f9fc7131bc5e	3	1	HOAN_THANH	2026-10-25 19:55:45.901012+07	2026-10-18 19:55:45.901012+07	2026-10-18 23:55:45.901012+07	\N		\N			2026-10-23 19:55:45.903704+07	2026-10-23 19:55:45.903704+07	14	\N	\N
21	vanbandi	27	\N	demo/DEMO-KY-7-5.pdf	aa46f01f1de08ae95ace27fca0d12574dcb146880e377900dbb3f78685b1b4c4	3	1	TU_CHOI	2026-10-24 19:55:45.908831+07	2026-10-17 19:55:45.908831+07	\N	2026-10-17 23:55:45.908831+07	Nội dung chưa phù hợp, đề nghị rà soát lại.	\N			2026-10-23 19:55:45.911769+07	2026-10-23 19:55:45.911769+07	15	\N	\N
22	vanbandi	39	1	trinh_ky/2026/10/3862b9893e05458ca510b5e446b9f050.pdf	b696c56876f5f51bb34159c5f3fcc04c8deac56e5568410cf1bd416efe806b3f	4	1	NHAP	2026-10-27 09:58:22.104369+07	\N	\N	\N		\N		Dữ liệu mẫu M01: nháp do chuyên viên soạn, chưa gửi	2026-10-24 08:58:22.233303+07	2026-10-24 09:58:22.233303+07	7	\N	\N
23	vanbandi	40	1	trinh_ky/2026/10/870244b66df94a08b61f281444b037c6.pdf	69aecd9429a839b87a0dd7965d93af87dd4fd21b6a6577477cc293331e157c5a	4	1	CHO_KY	2026-10-27 09:58:22.265729+07	2026-10-22 06:58:22.281578+07	\N	\N		\N		Dữ liệu mẫu M02: đang chờ Trưởng phòng ký (cấp 1)	2026-10-22 06:58:22.269325+07	2026-10-24 09:58:22.292405+07	6	6	\N
24	vanbandi	41	1	trinh_ky/2026/10/456e5ae6e2ad446b881127df1ebc792f.pdf	76a690df954662ab6bf3fbbfecde705fc2262cb55a50a3de0c8cbaf80a1560c1	4	1	CHO_KY	2026-10-27 09:58:22.357824+07	2026-10-20 06:58:22.371289+07	\N	\N		\N		Dữ liệu mẫu M03: Trưởng phòng đã ký, chờ Giám đốc (cấp 2)	2026-10-20 06:58:22.363378+07	2026-10-24 09:58:22.375288+07	6	6	\N
25	vanbandi	42	1	trinh_ky/2026/10/8b1aca0b06214151a2ce1efaa679d715.pdf	399310134cc6608f6071240c6951098b1cb54489dbd97e29fdd607a0a195184c	5	1	HOAN_THANH	2026-10-27 09:58:22.442801+07	2026-10-23 06:58:22.458724+07	2026-10-24 09:58:22.494571+07	\N		\N		Dữ liệu mẫu M04: hoàn tất duyệt nội bộ (ký nháy rồi ký chính)	2026-10-23 06:58:22.44777+07	2026-10-24 09:58:22.500703+07	6	6	\N
26	vanbandi	43	1	trinh_ky/2026/10/9247c97132454fea9c54ef77d274bafb.pdf	c14bb7d4d523d2e39f3dd6ede12a723fdc8db9f2bd7a5eb450c4528d3d1f5f75	4	1	TU_CHOI	2026-10-27 09:58:22.774136+07	2026-10-21 06:58:22.787995+07	\N	2026-10-24 09:58:22.822024+07	Chưa đủ căn cứ pháp lý về chi phí thuê ngoài	\N		Dữ liệu mẫu M05: Giám đốc không đồng ý ban hành; đã tạo hồ sơ trình lại	2026-10-21 06:58:22.779644+07	2026-10-24 09:58:22.823993+07	6	6	\N
27	vanbandi	43	1	trinh_ky/2026/10/9247c97132454fea9c54ef77d274bafb.pdf	c14bb7d4d523d2e39f3dd6ede12a723fdc8db9f2bd7a5eb450c4528d3d1f5f75	4	1	NHAP	2026-10-29 09:58:22.829446+07	\N	\N	\N		\N		Dữ liệu mẫu M05: Giám đốc không đồng ý ban hành; đã tạo hồ sơ trình lại	2026-10-24 09:58:22.836997+07	2026-10-24 09:58:22.836997+07	6	\N	26
28	vanbandi	44	1	trinh_ky/2026/10/9408506a01984585bb7a4cc21ffe4f12.pdf	e6f22c660146fba531bf237199131ca9cee21608666aa4305be15a8ecaac37af	4	1	CHO_KY	2026-10-27 09:58:22.885936+07	2026-10-18 06:58:22.898635+07	\N	\N		\N		Dữ liệu mẫu M06: Trưởng phòng trả lại để sửa, đang trao đổi	2026-10-18 06:58:22.891549+07	2026-10-24 09:58:22.902466+07	6	6	\N
29	vanbandi	45	2	trinh_ky/2026/10/3914e52606ea40399e92b5b30f48df0e.pdf	83d3d38bdae47aa507a323af69e8bdcdb6323ef0f44d7eb429efb8b84b553d3e	4	1	CHO_KY	2026-10-27 09:58:22.987783+07	2026-10-17 06:58:23.00124+07	\N	\N		\N		Dữ liệu mẫu M07: đã sửa theo yêu cầu, trình lại lượt 2	2026-10-17 06:58:22.993381+07	2026-10-24 09:58:23.055923+07	6	6	\N
30	vanbandi	46	1	trinh_ky/2026/10/567dc635717741618c1d471ab45219e7.pdf	814fd24aa1cb97d2310013e588209f24698af70f65257314a1388b5b7f04b8eb	4	1	HUY	2026-10-27 09:58:23.138631+07	2026-10-19 06:58:23.151489+07	\N	\N		2026-10-24 09:58:23.163173+07	Lịch bảo trì thay đổi, không cần ban hành	Dữ liệu mẫu M08: người tạo hủy khi đang ký	2026-10-19 06:58:23.144087+07	2026-10-24 09:58:23.165742+07	6	6	\N
31	vanbandi	47	1	trinh_ky/2026/10/ecaaab377d9e40a5904f34bec796b2f1.pdf	488b18bdbd8b1230283b85a7a016ee6c30699193893abd1a40ed2d86c98f2f16	4	1	CHO_KY	2026-10-24 05:58:23.229287+07	2026-10-16 06:58:23.218201+07	\N	\N		\N		Dữ liệu mẫu M09: quá hạn xử lý ở cấp Trưởng phòng	2026-10-16 06:58:23.210632+07	2026-10-24 09:58:23.222721+07	6	6	\N
32	vanbandi	48	1	trinh_ky/2026/10/078a48fc4ee344f388a9e39a442c5437.pdf	6f2fe7ab1211fa8d272080e1ab5fb38bb3d57858900c1f1c46e0d7be693c39c7	6	1	CHO_KY	2026-10-27 09:58:23.260438+07	2026-10-24 06:58:23.27435+07	\N	\N		\N		Dữ liệu mẫu M10: Trưởng phòng nghỉ phép, Giám đốc được ủy quyền ký thay	2026-10-24 06:58:23.266435+07	2026-10-24 09:58:23.278337+07	6	6	\N
\.


--
-- Data for Name: signing_request_step; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_request_step (id, luot_trinh_id, buoc_quy_trinh_id, cap_ky, ten_cap_ky, thu_tu, trang_thai, han_xu_ly, thoi_diem_mo, thoi_diem_hoan_thanh, ghi_chu, created_at) FROM stdin;
1	1	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-25 19:25:51.448766+07	2026-10-22 19:25:51.448766+07	\N		2026-10-23 19:25:51.481862+07
2	2	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-24 19:25:51.49803+07	2026-10-21 19:25:51.49803+07	\N		2026-10-23 19:25:51.510175+07
3	3	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-23 19:25:51.514262+07	2026-10-20 19:25:51.514262+07	\N		2026-10-23 19:25:51.515044+07
4	4	3	1	Lãnh đạo ký duyệt	1	HOAN_THANH	2026-10-21 19:25:51.515044+07	2026-10-18 19:25:51.515044+07	2026-10-18 23:25:51.515044+07		2026-10-23 19:25:51.515044+07
5	5	3	1	Lãnh đạo ký duyệt	1	HOAN_THANH	2026-10-20 19:25:51.525935+07	2026-10-17 19:25:51.525935+07	2026-10-17 23:25:51.525935+07		2026-10-23 19:25:51.53125+07
6	6	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-25 19:55:40.525786+07	2026-10-22 19:55:40.525786+07	\N		2026-10-23 19:55:40.541677+07
7	7	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-24 19:55:40.555569+07	2026-10-21 19:55:40.555569+07	\N		2026-10-23 19:55:40.555569+07
8	8	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-23 19:55:40.555569+07	2026-10-20 19:55:40.555569+07	\N		2026-10-23 19:55:40.569664+07
9	9	3	1	Lãnh đạo ký duyệt	1	HOAN_THANH	2026-10-21 19:55:40.57167+07	2026-10-18 19:55:40.57167+07	2026-10-18 23:55:40.57167+07		2026-10-23 19:55:40.574968+07
10	10	3	1	Lãnh đạo ký duyệt	1	HOAN_THANH	2026-10-20 19:55:40.578245+07	2026-10-17 19:55:40.578245+07	2026-10-17 23:55:40.578245+07		2026-10-23 19:55:40.581966+07
11	11	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-25 19:55:43.19065+07	2026-10-22 19:55:43.19065+07	\N		2026-10-23 19:55:43.198581+07
12	12	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-24 19:55:43.215484+07	2026-10-21 19:55:43.215484+07	\N		2026-10-23 19:55:43.221644+07
13	13	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-23 19:55:43.223865+07	2026-10-20 19:55:43.223865+07	\N		2026-10-23 19:55:43.223865+07
14	14	3	1	Lãnh đạo ký duyệt	1	HOAN_THANH	2026-10-21 19:55:43.22908+07	2026-10-18 19:55:43.22908+07	2026-10-18 23:55:43.22908+07		2026-10-23 19:55:43.22908+07
15	15	3	1	Lãnh đạo ký duyệt	1	HOAN_THANH	2026-10-20 19:55:43.234897+07	2026-10-17 19:55:43.234897+07	2026-10-17 23:55:43.234897+07		2026-10-23 19:55:43.238284+07
16	16	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-25 19:55:45.856152+07	2026-10-22 19:55:45.856152+07	\N		2026-10-23 19:55:45.871934+07
17	17	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-24 19:55:45.884358+07	2026-10-21 19:55:45.884358+07	\N		2026-10-23 19:55:45.891762+07
18	18	3	1	Lãnh đạo ký duyệt	1	DANG_KY	2026-10-23 19:55:45.893693+07	2026-10-20 19:55:45.893693+07	\N		2026-10-23 19:55:45.898001+07
19	19	3	1	Lãnh đạo ký duyệt	1	HOAN_THANH	2026-10-21 19:55:45.901012+07	2026-10-18 19:55:45.901012+07	2026-10-18 23:55:45.901012+07		2026-10-23 19:55:45.905983+07
20	20	3	1	Lãnh đạo ký duyệt	1	HOAN_THANH	2026-10-20 19:55:45.908831+07	2026-10-17 19:55:45.908831+07	2026-10-17 23:55:45.908831+07		2026-10-23 19:55:45.913425+07
22	21	5	2	Giám đốc duyệt	2	CHUA_MO	\N	\N	\N		2026-10-24 09:58:22.291399+07
21	21	4	1	Trưởng phòng duyệt	1	DANG_KY	2026-10-25 09:58:22.281578+07	2026-10-24 09:58:22.281578+07	\N		2026-10-24 09:58:22.281578+07
23	22	4	1	Trưởng phòng duyệt	1	HOAN_THANH	2026-10-25 09:58:22.371289+07	2026-10-24 09:58:22.371289+07	2026-10-24 09:58:22.3919+07		2026-10-24 09:58:22.372293+07
24	22	5	2	Giám đốc duyệt	2	DANG_KY	2026-10-26 09:58:22.3919+07	2026-10-24 09:58:22.3919+07	\N		2026-10-24 09:58:22.373328+07
25	23	6	1	Kiểm tra và phê duyệt	1	HOAN_THANH	2026-10-26 09:58:22.458724+07	2026-10-24 09:58:22.458724+07	2026-10-24 09:58:22.494571+07		2026-10-24 09:58:22.459748+07
26	24	4	1	Trưởng phòng duyệt	1	HOAN_THANH	2026-10-25 09:58:22.787995+07	2026-10-24 09:58:22.787995+07	2026-10-24 09:58:22.806607+07		2026-10-24 09:58:22.787995+07
27	24	5	2	Giám đốc duyệt	2	TAM_DUNG	2026-10-26 09:58:22.806607+07	2026-10-24 09:58:22.806607+07	\N		2026-10-24 09:58:22.790577+07
29	25	5	2	Giám đốc duyệt	2	CHUA_MO	\N	\N	\N		2026-10-24 09:58:22.901459+07
28	25	4	1	Trưởng phòng duyệt	1	TAM_DUNG	2026-10-25 09:58:22.898635+07	2026-10-24 09:58:22.898635+07	\N		2026-10-24 09:58:22.90026+07
31	26	5	2	Giám đốc duyệt	2	CHUA_MO	\N	\N	\N		2026-10-24 09:58:23.003239+07
30	26	4	1	Trưởng phòng duyệt	1	TAM_DUNG	2026-10-25 09:58:23.00124+07	2026-10-24 09:58:23.00124+07	\N		2026-10-24 09:58:23.002238+07
32	27	4	1	Trưởng phòng duyệt	1	HOAN_THANH	2026-10-25 09:58:23.054322+07	2026-10-24 09:58:23.054322+07	2026-10-24 09:58:23.072509+07		2026-10-24 09:58:23.057932+07
33	27	5	2	Giám đốc duyệt	2	DANG_KY	2026-10-26 09:58:23.072509+07	2026-10-24 09:58:23.072509+07	\N		2026-10-24 09:58:23.059531+07
35	28	5	2	Giám đốc duyệt	2	CHUA_MO	\N	\N	\N		2026-10-24 09:58:23.153434+07
34	28	4	1	Trưởng phòng duyệt	1	TAM_DUNG	2026-10-25 09:58:23.151489+07	2026-10-24 09:58:23.151489+07	\N		2026-10-24 09:58:23.151489+07
37	29	5	2	Giám đốc duyệt	2	CHUA_MO	\N	\N	\N		2026-10-24 09:58:23.220757+07
36	29	4	1	Trưởng phòng duyệt	1	DANG_KY	2026-10-24 03:58:23.229287+07	2026-10-24 09:58:23.218201+07	\N		2026-10-24 09:58:23.219715+07
39	30	8	2	Giám đốc duyệt	2	CHUA_MO	\N	\N	\N		2026-10-24 09:58:23.277337+07
38	30	7	1	Lấy ý kiến các bộ phận	1	DANG_KY	2026-10-25 09:58:23.27435+07	2026-10-24 09:58:23.27435+07	\N		2026-10-24 09:58:23.27435+07
\.


--
-- Data for Name: signing_request_step_signer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_request_step_signer (id, buoc_ky_id, nguoi_ky_id, chuc_vu_id, ten_nguoi_ky, ten_chuc_vu, vai_tro_ky, chan_ky_chinh, trang_thai, thoi_diem_mo, ngay_ky, ngay_tu_choi, ly_do_tu_choi, chu_ky_hien_hanh_id, uy_quyen_tu_id, ly_do_uy_quyen, ngay_uy_quyen, trang_ky, toa_do_x, toa_do_y, chieu_rong_khung, chieu_cao_khung, khoa_chong_trung_thao_tac, created_at) FROM stdin;
1	1	1	\N	Quản trị hệ thống	\N	KY_CHINH	t	CHO_KY	2026-10-22 19:25:51.448766+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:25:51.49803+07
2	2	1	\N	Quản trị hệ thống	\N	KY_CHINH	t	CHO_KY	2026-10-21 19:25:51.49803+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:25:51.512244+07
3	3	1	\N	Quản trị hệ thống	\N	KY_CHINH	t	CHO_KY	2026-10-20 19:25:51.514262+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:25:51.515044+07
4	4	1	\N	Quản trị hệ thống	\N	KY_CHINH	t	DA_KY	2026-10-18 19:25:51.515044+07	2026-10-18 23:25:51.515044+07	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:25:51.515044+07
5	5	1	\N	Quản trị hệ thống	\N	KY_CHINH	t	TU_CHOI	2026-10-17 19:25:51.525935+07	\N	2026-10-17 23:25:51.525935+07	Nội dung chưa phù hợp, đề nghị rà soát lại.	\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:25:51.53125+07
6	6	8	\N	Trưởng Phòng	\N	KY_CHINH	t	CHO_KY	2026-10-22 19:55:40.525786+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:40.550049+07
7	7	8	\N	Trưởng Phòng	\N	KY_CHINH	t	CHO_KY	2026-10-21 19:55:40.555569+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:40.555569+07
8	8	8	\N	Trưởng Phòng	\N	KY_CHINH	t	CHO_KY	2026-10-20 19:55:40.555569+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:40.569664+07
9	9	8	\N	Trưởng Phòng	\N	KY_CHINH	t	DA_KY	2026-10-18 19:55:40.57167+07	2026-10-18 23:55:40.57167+07	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:40.578245+07
10	10	8	\N	Trưởng Phòng	\N	KY_CHINH	t	TU_CHOI	2026-10-17 19:55:40.578245+07	\N	2026-10-17 23:55:40.578245+07	Nội dung chưa phù hợp, đề nghị rà soát lại.	\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:40.584677+07
11	11	9	\N	Giám Đốc	\N	KY_CHINH	t	CHO_KY	2026-10-22 19:55:43.19065+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:43.210936+07
12	12	9	\N	Giám Đốc	\N	KY_CHINH	t	CHO_KY	2026-10-21 19:55:43.215484+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:43.222615+07
13	13	9	\N	Giám Đốc	\N	KY_CHINH	t	CHO_KY	2026-10-20 19:55:43.223865+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:43.22908+07
14	14	9	\N	Giám Đốc	\N	KY_CHINH	t	DA_KY	2026-10-18 19:55:43.22908+07	2026-10-18 23:55:43.22908+07	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:43.234897+07
15	15	9	\N	Giám Đốc	\N	KY_CHINH	t	TU_CHOI	2026-10-17 19:55:43.234897+07	\N	2026-10-17 23:55:43.234897+07	Nội dung chưa phù hợp, đề nghị rà soát lại.	\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:43.238284+07
16	16	7	\N	Chuyên Viên	\N	KY_CHINH	t	CHO_KY	2026-10-22 19:55:45.856152+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:45.879324+07
17	17	7	\N	Chuyên Viên	\N	KY_CHINH	t	CHO_KY	2026-10-21 19:55:45.884358+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:45.892288+07
18	18	7	\N	Chuyên Viên	\N	KY_CHINH	t	CHO_KY	2026-10-20 19:55:45.893693+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:45.899567+07
19	19	7	\N	Chuyên Viên	\N	KY_CHINH	t	DA_KY	2026-10-18 19:55:45.901012+07	2026-10-18 23:55:45.901012+07	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:45.907531+07
20	20	7	\N	Chuyên Viên	\N	KY_CHINH	t	TU_CHOI	2026-10-17 19:55:45.908831+07	\N	2026-10-17 23:55:45.908831+07	Nội dung chưa phù hợp, đề nghị rà soát lại.	\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-23 19:55:45.914395+07
22	22	9	\N	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	CHO_KY	\N	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:22.292405+07
21	21	8	\N	Trưởng Phòng	Trưởng phòng	KY_CHINH	t	CHO_KY	2026-10-24 09:58:22.281578+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:22.287376+07
33	32	8	\N	Trưởng Phòng	Trưởng phòng	KY_CHINH	t	DA_KY	2026-10-24 09:58:23.054322+07	2026-10-24 09:58:23.072509+07	\N		5	\N		\N	\N	\N	\N	\N	\N	Dữ liệu mẫu:20261024025821761319:29:ky-8-1792810703.066857	2026-10-24 09:58:23.057932+07
23	23	8	\N	Trưởng Phòng	Trưởng phòng	KY_CHINH	t	DA_KY	2026-10-24 09:58:22.371289+07	2026-10-24 09:58:22.3919+07	\N		1	\N		\N	\N	\N	\N	\N	\N	Dữ liệu mẫu:20261024025821761319:24:ky-8-1792810702.3852	2026-10-24 09:58:22.373328+07
24	24	9	\N	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	CHO_KY	2026-10-24 09:58:22.3919+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:22.374289+07
34	33	9	\N	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	CHO_KY	2026-10-24 09:58:23.072509+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:23.059531+07
25	25	8	\N	Trưởng Phòng	Trưởng phòng	KY_NHAY	t	DA_KY	2026-10-24 09:58:22.458724+07	2026-10-24 09:58:22.477958+07	\N		2	\N		\N	\N	\N	\N	\N	\N	Dữ liệu mẫu:20261024025821761319:25:ky-8-1792810702.472993	2026-10-24 09:58:22.459748+07
26	25	9	\N	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	DA_KY	2026-10-24 09:58:22.477958+07	2026-10-24 09:58:22.494571+07	\N		3	\N		\N	\N	\N	\N	\N	\N	Dữ liệu mẫu:20261024025821761319:25:ky-9-1792810702.489528	2026-10-24 09:58:22.462202+07
36	35	9	\N	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	CHO_KY	\N	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:23.153434+07
27	26	8	\N	Trưởng Phòng	Trưởng phòng	KY_CHINH	t	DA_KY	2026-10-24 09:58:22.787995+07	2026-10-24 09:58:22.806607+07	\N		4	\N		\N	\N	\N	\N	\N	\N	Dữ liệu mẫu:20261024025821761319:26:ky-8-1792810702.800523	2026-10-24 09:58:22.789572+07
35	34	8	\N	Trưởng Phòng	Trưởng phòng	KY_CHINH	t	CHO_KY	2026-10-24 09:58:23.151489+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:23.152519+07
28	27	9	\N	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	TU_CHOI	2026-10-24 09:58:22.806607+07	\N	2026-10-24 09:58:22.822024+07	Chưa đủ căn cứ pháp lý về chi phí thuê ngoài	\N	\N		\N	\N	\N	\N	\N	\N	Dữ liệu mẫu:20261024025821761319:M05:tu-choi	2026-10-24 09:58:22.791578+07
30	29	9	\N	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	CHO_KY	\N	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:22.902466+07
29	28	8	\N	Trưởng Phòng	Trưởng phòng	KY_CHINH	t	YEU_CAU_SUA	2026-10-24 09:58:22.898635+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	Dữ liệu mẫu:20261024025821761319:M06:yeu-cau-sua	2026-10-24 09:58:22.901459+07
32	31	9	\N	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	CHO_KY	\N	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:23.004237+07
40	38	1	\N	Quản trị hệ thống	Quản trị viên	KY_CHINH	t	DA_KY	2026-10-24 09:58:23.27435+07	2026-10-24 09:58:23.294976+07	\N		6	\N		\N	\N	\N	\N	\N	\N	Dữ liệu mẫu:20261024025821761319:32:ky-1-1792810703.289966	2026-10-24 09:58:23.276337+07
31	30	8	\N	Trưởng Phòng	Trưởng phòng	KY_CHINH	t	YEU_CAU_SUA	2026-10-24 09:58:23.00124+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	Dữ liệu mẫu:20261024025821761319:M07:yeu-cau-sua	2026-10-24 09:58:23.003239+07
39	38	9	7	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	CHO_KY	2026-10-24 09:58:23.27435+07	\N	\N		\N	8	Trưởng phòng nghỉ phép đến hết tuần	2026-10-24 09:58:23.316902+07	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:23.275337+07
38	37	9	\N	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	CHO_KY	\N	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:23.221721+07
37	36	8	\N	Trưởng Phòng	Trưởng phòng	KY_CHINH	t	CHO_KY	2026-10-24 09:58:23.218201+07	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:23.220757+07
41	39	9	\N	Giám Đốc	Lãnh đạo cơ quan	KY_CHINH	t	CHO_KY	\N	\N	\N		\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-10-24 09:58:23.278337+07
\.


--
-- Data for Name: signing_signature; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signing_signature (id, luot_trinh_id, buoc_ky_id, khoa_ky_id, hash_tai_lieu, thuat_toan, chu_ky_so, ghi_chu_ky, ky_tre_han, so_giay_tre, ngay_ky, trang_thai_xac_minh, thoi_diem_xac_minh, vi_tri_anh_chu_ky, ma_bam_anh_chu_ky, created_at) FROM stdin;
1	22	23	1	76a690df954662ab6bf3fbbfecde705fc2262cb55a50a3de0c8cbaf80a1560c1	Ed25519	77Hc7Y2yU5HSQpkfJLEq9J791oYUwSv4YblFq7lqeAekSir4jMDh+nOTYpCXPJGBv5mmg0ouCR5Bm84YNvScDw==	Đã kiểm tra số liệu, đề nghị Giám đốc phê duyệt	f	\N	2026-10-24 09:58:22.3919+07	HOP_LE	2026-10-24 09:58:22.3919+07			2026-10-24 09:58:22.3939+07
2	23	25	1	399310134cc6608f6071240c6951098b1cb54489dbd97e29fdd607a0a195184c	Ed25519	S27A/o4xpUptHXXYGaL2RXXMZDNu9Ik0R9acY2GWI55fz6oLCJ/cicVYaiHevxo40t6pZfQR3iXIql/6OoODAw==	Thể thức đúng quy định	f	\N	2026-10-24 09:58:22.477958+07	HOP_LE	2026-10-24 09:58:22.477958+07			2026-10-24 09:58:22.479463+07
3	23	26	2	399310134cc6608f6071240c6951098b1cb54489dbd97e29fdd607a0a195184c	Ed25519	Xj+l204y7YGOiuBxqiq9/thTMD5T3cyQNVGdUw9Yx7JAl0WMct0fSC8qyE2RiegiuX2xYHNxkN5nslLEwcvmBw==		f	\N	2026-10-24 09:58:22.494571+07	HOP_LE	2026-10-24 09:58:22.494571+07			2026-10-24 09:58:22.496541+07
4	24	27	1	c14bb7d4d523d2e39f3dd6ede12a723fdc8db9f2bd7a5eb450c4528d3d1f5f75	Ed25519	4NHvAuPNd+IL6xj/UUDMR+v0z26fbou+VKY9puBOkLsDETmoGHssmN5mMq/pBVey1eYxGjQgtKxhC5u0VHvSBg==		f	\N	2026-10-24 09:58:22.806607+07	HOP_LE	2026-10-24 09:58:22.806607+07			2026-10-24 09:58:22.807691+07
5	27	33	1	83d3d38bdae47aa507a323af69e8bdcdb6323ef0f44d7eb429efb8b84b553d3e	Ed25519	gUQF3w35jrewxyt0e04ASFLI5c9GSF6uNCJQGcL9vIYEO1sSb9b2hh6pkkMCU7U+3VDkyGcNZnFk9SgtYFSVCg==	Đã sửa đúng yêu cầu	f	\N	2026-10-24 09:58:23.072509+07	HOP_LE	2026-10-24 09:58:23.072509+07			2026-10-24 09:58:23.073509+07
6	30	40	3	6f2fe7ab1211fa8d272080e1ab5fb38bb3d57858900c1f1c46e0d7be693c39c7	Ed25519	O7lxXscnTO5uJMZQmRfj/c5qsJ171C9i1v5ICuBmrZb3IP+C41gJXgyjws0clZozSrhBNjM7n2b6q40PgswuDg==	Đồng ý về mặt kỹ thuật	f	\N	2026-10-24 09:58:23.294976+07	HOP_LE	2026-10-24 09:58:23.294976+07			2026-10-24 09:58:23.295976+07
\.


--
-- Data for Name: task_attachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_attachment (id, name, path, cong_viec_id, y_kien_id, loai, is_deleted, created_at, nguoi_tao_id) FROM stdin;
\.


--
-- Data for Name: task_comment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_comment (id, cong_viec, nguoi_ghi, noi_dung, created_at) FROM stdin;
\.


--
-- Data for Name: task_congviec; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_congviec (id, noi_dung, ngay_tao_cv, ngay_xu_ly, yeu_cau_xu_ly, nguoi_tao_id, document_type, document_id, hien_thi, opened_at, opened_by, approved_at, approved_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: task_congviec_donvi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_congviec_donvi (id, cong_viec, don_vi, created_at) FROM stdin;
\.


--
-- Data for Name: task_participant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_participant (id, cong_viec, can_bo, vai_tro) FROM stdin;
\.


--
-- Data for Name: token_blacklist_blacklistedtoken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_blacklist_blacklistedtoken (id, blacklisted_at, token_id) FROM stdin;
\.


--
-- Data for Name: token_blacklist_outstandingtoken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_blacklist_outstandingtoken (id, token, created_at, expires_at, user_id, jti) FROM stdin;
\.


--
-- Data for Name: work_task; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_task (id, title, created_date, due_date, requirement, is_public, first_opened_at, approved_at, created_at, updated_at, approved_by_id, created_by_id, first_opened_by_id) FROM stdin;
\.


--
-- Data for Name: work_taskattachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_taskattachment (id, kind, file, original_name, size, uploaded_at, task_id, uploaded_by_id, comment_id) FROM stdin;
\.


--
-- Data for Name: work_taskcomment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_taskcomment (id, content, created_at, author_id, task_id) FROM stdin;
\.


--
-- Data for Name: work_taskparticipant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_taskparticipant (id, role, task_id, user_id) FROM stdin;
\.


--
-- Name: accounts_employee_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounts_employee_groups_id_seq', 5, true);


--
-- Name: accounts_employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounts_employee_id_seq', 46, true);


--
-- Name: accounts_employee_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounts_employee_user_permissions_id_seq', 1, false);


--
-- Name: accounts_position_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounts_position_id_seq', 10, true);


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 5, true);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 197, true);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 77, true);


--
-- Name: birthdays_birthdayemaillog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.birthdays_birthdayemaillog_id_seq', 1, false);


--
-- Name: birthdays_birthdaywish_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.birthdays_birthdaywish_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 15, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 103, true);


--
-- Name: documents_access_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_access_log_id_seq', 3, true);


--
-- Name: documents_vanbanden_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_vanbanden_attachment_id_seq', 36, true);


--
-- Name: documents_vanbanden_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_vanbanden_id_seq', 89, true);


--
-- Name: documents_vanbandi_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_vanbandi_attachment_id_seq', 16, true);


--
-- Name: documents_vanbandi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_vanbandi_id_seq', 48, true);


--
-- Name: documents_view_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_view_log_id_seq', 11, true);


--
-- Name: meetings_meetingbooking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meetings_meetingbooking_id_seq', 1, false);


--
-- Name: meetings_meetingroom_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meetings_meetingroom_id_seq', 1, false);


--
-- Name: organizations_donvi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organizations_donvi_id_seq', 85, true);


--
-- Name: organizations_khoi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organizations_khoi_id_seq', 19, true);


--
-- Name: records_chitiettailieu_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.records_chitiettailieu_attachment_id_seq', 13, true);


--
-- Name: records_chitiettailieu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.records_chitiettailieu_id_seq', 13, true);


--
-- Name: records_hoso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.records_hoso_id_seq', 2, true);


--
-- Name: records_loaitailieu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.records_loaitailieu_id_seq', 7, true);


--
-- Name: records_loaivanban_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.records_loaivanban_id_seq', 2, true);


--
-- Name: records_tailieu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.records_tailieu_id_seq', 3, true);


--
-- Name: signing_attempt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_attempt_id_seq', 30, true);


--
-- Name: signing_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_audit_log_id_seq', 68, true);


--
-- Name: signing_change_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_change_message_id_seq', 3, true);


--
-- Name: signing_change_thread_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_change_thread_id_seq', 2, true);


--
-- Name: signing_key_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_key_id_seq', 3, true);


--
-- Name: signing_key_unlock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_key_unlock_id_seq', 1, false);


--
-- Name: signing_manifest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_manifest_id_seq', 1, true);


--
-- Name: signing_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_notification_id_seq', 82, true);


--
-- Name: signing_process_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_process_id_seq', 7, true);


--
-- Name: signing_process_step_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_process_step_id_seq', 9, true);


--
-- Name: signing_process_step_signer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_process_step_signer_id_seq', 14, true);


--
-- Name: signing_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_request_id_seq', 32, true);


--
-- Name: signing_request_step_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_request_step_id_seq', 39, true);


--
-- Name: signing_request_step_signer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_request_step_signer_id_seq', 41, true);


--
-- Name: signing_signature_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signing_signature_id_seq', 6, true);


--
-- Name: task_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_attachment_id_seq', 1, false);


--
-- Name: task_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_comment_id_seq', 1, false);


--
-- Name: task_congviec_donvi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_congviec_donvi_id_seq', 1, false);


--
-- Name: task_congviec_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_congviec_id_seq', 1, false);


--
-- Name: task_participant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_participant_id_seq', 1, false);


--
-- Name: token_blacklist_blacklistedtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.token_blacklist_blacklistedtoken_id_seq', 5, true);


--
-- Name: token_blacklist_outstandingtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.token_blacklist_outstandingtoken_id_seq', 12, true);


--
-- Name: work_task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_task_id_seq', 1, false);


--
-- Name: work_taskattachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_taskattachment_id_seq', 1, false);


--
-- Name: work_taskcomment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_taskcomment_id_seq', 1, false);


--
-- Name: work_taskparticipant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_taskparticipant_id_seq', 1, false);


--
-- Name: accounts_employee accounts_employee_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee
    ADD CONSTRAINT accounts_employee_email_key UNIQUE (email);


--
-- Name: accounts_employee_groups accounts_employee_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee_groups
    ADD CONSTRAINT accounts_employee_groups_pkey PRIMARY KEY (id);


--
-- Name: accounts_employee accounts_employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee
    ADD CONSTRAINT accounts_employee_pkey PRIMARY KEY (id);


--
-- Name: accounts_employee_user_permissions accounts_employee_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee_user_permissions
    ADD CONSTRAINT accounts_employee_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: accounts_employee accounts_employee_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee
    ADD CONSTRAINT accounts_employee_username_key UNIQUE (username);


--
-- Name: accounts_position accounts_position_display_order_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_position
    ADD CONSTRAINT accounts_position_display_order_key UNIQUE (display_order);


--
-- Name: accounts_position accounts_position_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_position
    ADD CONSTRAINT accounts_position_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_ma_nhom_quyen_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_ma_nhom_quyen_key UNIQUE (ma_nhom_quyen);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_codename_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_codename_key UNIQUE (codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: birthdays_birthdayemaillog birthdays_birthdayemaillog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.birthdays_birthdayemaillog
    ADD CONSTRAINT birthdays_birthdayemaillog_pkey PRIMARY KEY (id);


--
-- Name: birthdays_birthdaywish birthdays_birthdaywish_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.birthdays_birthdaywish
    ADD CONSTRAINT birthdays_birthdaywish_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: documents_access_log documents_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_access_log
    ADD CONSTRAINT documents_access_log_pkey PRIMARY KEY (id);


--
-- Name: documents_vanbanden_attachment documents_vanbanden_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_attachment
    ADD CONSTRAINT documents_vanbanden_attachment_pkey PRIMARY KEY (id);


--
-- Name: documents_vanbanden_danhmuc documents_vanbanden_danhmuc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_danhmuc
    ADD CONSTRAINT documents_vanbanden_danhmuc_pkey PRIMARY KEY (vanbanden_id, loaivanban_id);


--
-- Name: documents_vanbanden_donvinhan documents_vanbanden_donvinhan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_donvinhan
    ADD CONSTRAINT documents_vanbanden_donvinhan_pkey PRIMARY KEY (vanbanden_id, donvi_id);


--
-- Name: documents_vanbanden_hoso documents_vanbanden_hoso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_hoso
    ADD CONSTRAINT documents_vanbanden_hoso_pkey PRIMARY KEY (vanbanden_id, hoso_id);


--
-- Name: documents_vanbanden_nguoinhan documents_vanbanden_nguoinhan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_nguoinhan
    ADD CONSTRAINT documents_vanbanden_nguoinhan_pkey PRIMARY KEY (vanbanden_id, employee_id);


--
-- Name: documents_vanbanden documents_vanbanden_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden
    ADD CONSTRAINT documents_vanbanden_pkey PRIMARY KEY (id);


--
-- Name: documents_vanbandi_attachment documents_vanbandi_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_attachment
    ADD CONSTRAINT documents_vanbandi_attachment_pkey PRIMARY KEY (id);


--
-- Name: documents_vanbandi_danhmuc documents_vanbandi_danhmuc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_danhmuc
    ADD CONSTRAINT documents_vanbandi_danhmuc_pkey PRIMARY KEY (vanbandi_id, loaivanban_id);


--
-- Name: documents_vanbandi_donvinhan documents_vanbandi_donvinhan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_donvinhan
    ADD CONSTRAINT documents_vanbandi_donvinhan_pkey PRIMARY KEY (vanbandi_id, donvi_id);


--
-- Name: documents_vanbandi_hoso documents_vanbandi_hoso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_hoso
    ADD CONSTRAINT documents_vanbandi_hoso_pkey PRIMARY KEY (vanbandi_id, hoso_id);


--
-- Name: documents_vanbandi_nguoinhan documents_vanbandi_nguoinhan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_nguoinhan
    ADD CONSTRAINT documents_vanbandi_nguoinhan_pkey PRIMARY KEY (vanbandi_id, employee_id);


--
-- Name: documents_vanbandi_noibanhanh documents_vanbandi_noibanhanh_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_noibanhanh
    ADD CONSTRAINT documents_vanbandi_noibanhanh_pkey PRIMARY KEY (vanbandi_id, donvi_id);


--
-- Name: documents_vanbandi documents_vanbandi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi
    ADD CONSTRAINT documents_vanbandi_pkey PRIMARY KEY (id);


--
-- Name: documents_view_log documents_view_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_view_log
    ADD CONSTRAINT documents_view_log_pkey PRIMARY KEY (id);


--
-- Name: meetings_meetingbooking excl_room_time; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings_meetingbooking
    ADD CONSTRAINT excl_room_time EXCLUDE USING gist (room_id WITH =, tsrange((date + start_time), (date + end_time)) WITH &&) WHERE ((trang_thai <> 'CANCELLED'::public.meetingbooking_status));


--
-- Name: meetings_meetingbooking meetings_meetingbooking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings_meetingbooking
    ADD CONSTRAINT meetings_meetingbooking_pkey PRIMARY KEY (id);


--
-- Name: meetings_meetingroom meetings_meetingroom_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings_meetingroom
    ADD CONSTRAINT meetings_meetingroom_name_key UNIQUE (name);


--
-- Name: meetings_meetingroom meetings_meetingroom_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings_meetingroom
    ADD CONSTRAINT meetings_meetingroom_pkey PRIMARY KEY (id);


--
-- Name: organizations_donvi organizations_donvi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations_donvi
    ADD CONSTRAINT organizations_donvi_pkey PRIMARY KEY (id);


--
-- Name: organizations_donvi organizations_donvi_stt_uu_tien_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations_donvi
    ADD CONSTRAINT organizations_donvi_stt_uu_tien_key UNIQUE (stt_uu_tien);


--
-- Name: organizations_khoi organizations_khoi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations_khoi
    ADD CONSTRAINT organizations_khoi_pkey PRIMARY KEY (id);


--
-- Name: records_chitiettailieu_attachment records_chitiettailieu_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu_attachment
    ADD CONSTRAINT records_chitiettailieu_attachment_pkey PRIMARY KEY (id);


--
-- Name: records_chitiettailieu_loaitailieu records_chitiettailieu_loaitailieu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu_loaitailieu
    ADD CONSTRAINT records_chitiettailieu_loaitailieu_pkey PRIMARY KEY (chitiettailieu_id, loaitailieu_id);


--
-- Name: records_chitiettailieu records_chitiettailieu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu
    ADD CONSTRAINT records_chitiettailieu_pkey PRIMARY KEY (id);


--
-- Name: records_hoso records_hoso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_hoso
    ADD CONSTRAINT records_hoso_pkey PRIMARY KEY (id);


--
-- Name: records_hoso records_hoso_so_ky_hieu_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_hoso
    ADD CONSTRAINT records_hoso_so_ky_hieu_key UNIQUE (so_ky_hieu);


--
-- Name: records_hoso records_hoso_stt_uu_tien_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_hoso
    ADD CONSTRAINT records_hoso_stt_uu_tien_key UNIQUE (stt_uu_tien);


--
-- Name: records_loaitailieu records_loaitailieu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_loaitailieu
    ADD CONSTRAINT records_loaitailieu_pkey PRIMARY KEY (id);


--
-- Name: records_loaivanban records_loaivanban_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_loaivanban
    ADD CONSTRAINT records_loaivanban_pkey PRIMARY KEY (id);


--
-- Name: records_tailieu records_tailieu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_tailieu
    ADD CONSTRAINT records_tailieu_pkey PRIMARY KEY (id);


--
-- Name: records_tailieu records_tailieu_stt_uu_tien_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_tailieu
    ADD CONSTRAINT records_tailieu_stt_uu_tien_key UNIQUE (stt_uu_tien);


--
-- Name: signing_attempt signing_attempt_khoa_chong_trung_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_attempt
    ADD CONSTRAINT signing_attempt_khoa_chong_trung_key UNIQUE (khoa_chong_trung);


--
-- Name: signing_attempt signing_attempt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_attempt
    ADD CONSTRAINT signing_attempt_pkey PRIMARY KEY (id);


--
-- Name: signing_audit_log signing_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_audit_log
    ADD CONSTRAINT signing_audit_log_pkey PRIMARY KEY (id);


--
-- Name: signing_change_message signing_change_message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_change_message
    ADD CONSTRAINT signing_change_message_pkey PRIMARY KEY (id);


--
-- Name: signing_change_thread signing_change_thread_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_change_thread
    ADD CONSTRAINT signing_change_thread_pkey PRIMARY KEY (id);


--
-- Name: signing_key signing_key_dau_van_tay_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_key
    ADD CONSTRAINT signing_key_dau_van_tay_key UNIQUE (dau_van_tay);


--
-- Name: signing_key signing_key_ma_khoa_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_key
    ADD CONSTRAINT signing_key_ma_khoa_key UNIQUE (ma_khoa);


--
-- Name: signing_key signing_key_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_key
    ADD CONSTRAINT signing_key_pkey PRIMARY KEY (id);


--
-- Name: signing_key_unlock signing_key_unlock_khoa_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_key_unlock
    ADD CONSTRAINT signing_key_unlock_khoa_id_key UNIQUE (khoa_id);


--
-- Name: signing_key_unlock signing_key_unlock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_key_unlock
    ADD CONSTRAINT signing_key_unlock_pkey PRIMARY KEY (id);


--
-- Name: signing_manifest signing_manifest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_manifest
    ADD CONSTRAINT signing_manifest_pkey PRIMARY KEY (id);


--
-- Name: signing_notification signing_notification_khoa_chong_gui_trung_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_notification
    ADD CONSTRAINT signing_notification_khoa_chong_gui_trung_key UNIQUE (khoa_chong_gui_trung);


--
-- Name: signing_notification signing_notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_notification
    ADD CONSTRAINT signing_notification_pkey PRIMARY KEY (id);


--
-- Name: signing_process signing_process_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process
    ADD CONSTRAINT signing_process_pkey PRIMARY KEY (id);


--
-- Name: signing_process_step signing_process_step_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process_step
    ADD CONSTRAINT signing_process_step_pkey PRIMARY KEY (id);


--
-- Name: signing_process_step_signer signing_process_step_signer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process_step_signer
    ADD CONSTRAINT signing_process_step_signer_pkey PRIMARY KEY (id);


--
-- Name: signing_request signing_request_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request
    ADD CONSTRAINT signing_request_pkey PRIMARY KEY (id);


--
-- Name: signing_request_step signing_request_step_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step
    ADD CONSTRAINT signing_request_step_pkey PRIMARY KEY (id);


--
-- Name: signing_request_step_signer signing_request_step_signer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step_signer
    ADD CONSTRAINT signing_request_step_signer_pkey PRIMARY KEY (id);


--
-- Name: signing_signature signing_signature_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_signature
    ADD CONSTRAINT signing_signature_pkey PRIMARY KEY (id);


--
-- Name: task_attachment task_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachment
    ADD CONSTRAINT task_attachment_pkey PRIMARY KEY (id);


--
-- Name: task_comment task_comment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comment
    ADD CONSTRAINT task_comment_pkey PRIMARY KEY (id);


--
-- Name: task_congviec_donvi task_congviec_donvi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_congviec_donvi
    ADD CONSTRAINT task_congviec_donvi_pkey PRIMARY KEY (id);


--
-- Name: task_congviec task_congviec_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_congviec
    ADD CONSTRAINT task_congviec_pkey PRIMARY KEY (id);


--
-- Name: task_participant task_participant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_participant
    ADD CONSTRAINT task_participant_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_token_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_token_id_key UNIQUE (token_id);


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq UNIQUE (jti);


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outstandingtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outstandingtoken_pkey PRIMARY KEY (id);


--
-- Name: auth_group_permissions uq_auth_group_permission; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT uq_auth_group_permission UNIQUE (group_id, permission_id);


--
-- Name: birthdays_birthdayemaillog uq_emaillog_employee_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.birthdays_birthdayemaillog
    ADD CONSTRAINT uq_emaillog_employee_date UNIQUE (employee_id, sent_date);


--
-- Name: accounts_employee_groups uq_employee_group; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee_groups
    ADD CONSTRAINT uq_employee_group UNIQUE (employee_id, group_id);


--
-- Name: accounts_employee_user_permissions uq_employee_permission; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee_user_permissions
    ADD CONSTRAINT uq_employee_permission UNIQUE (employee_id, permission_id);


--
-- Name: signing_attempt uq_signing_attempt_so_luot; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_attempt
    ADD CONSTRAINT uq_signing_attempt_so_luot UNIQUE (trinh_ky_id, so_luot);


--
-- Name: signing_process uq_signing_process_ma_phien_ban; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process
    ADD CONSTRAINT uq_signing_process_ma_phien_ban UNIQUE (ma_quy_trinh, phien_ban);


--
-- Name: signing_process_step uq_signing_process_step_thu_tu; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process_step
    ADD CONSTRAINT uq_signing_process_step_thu_tu UNIQUE (quy_trinh_id, thu_tu);


--
-- Name: signing_request_step_signer uq_signing_request_step_signer_nguoi_ky; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step_signer
    ADD CONSTRAINT uq_signing_request_step_signer_nguoi_ky UNIQUE (buoc_ky_id, nguoi_ky_id);


--
-- Name: signing_request_step uq_signing_request_step_thu_tu; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step
    ADD CONSTRAINT uq_signing_request_step_thu_tu UNIQUE (luot_trinh_id, thu_tu);


--
-- Name: task_congviec_donvi uq_task_congviec_donvi; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_congviec_donvi
    ADD CONSTRAINT uq_task_congviec_donvi UNIQUE (cong_viec, don_vi);


--
-- Name: task_participant uq_task_participant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_participant
    ADD CONSTRAINT uq_task_participant UNIQUE (cong_viec, can_bo);


--
-- Name: documents_vanbanden uq_vanbanden_nam_stt; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden
    ADD CONSTRAINT uq_vanbanden_nam_stt UNIQUE (nam, so_thu_tu);


--
-- Name: documents_vanbandi uq_vanbandi_nam_stt; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi
    ADD CONSTRAINT uq_vanbandi_nam_stt UNIQUE (nam, so_thu_tu);


--
-- Name: documents_view_log uq_viewlog_doc_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_view_log
    ADD CONSTRAINT uq_viewlog_doc_user UNIQUE (document_type, document_id, user_id);


--
-- Name: work_taskparticipant work_participant_one_role_per_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskparticipant
    ADD CONSTRAINT work_participant_one_role_per_user UNIQUE (task_id, user_id);


--
-- Name: work_task work_task_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_task
    ADD CONSTRAINT work_task_pkey PRIMARY KEY (id);


--
-- Name: work_taskattachment work_taskattachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskattachment
    ADD CONSTRAINT work_taskattachment_pkey PRIMARY KEY (id);


--
-- Name: work_taskcomment work_taskcomment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskcomment
    ADD CONSTRAINT work_taskcomment_pkey PRIMARY KEY (id);


--
-- Name: work_taskparticipant work_taskparticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskparticipant
    ADD CONSTRAINT work_taskparticipant_pkey PRIMARY KEY (id);


--
-- Name: idx_access_log_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_log_document ON public.documents_access_log USING btree (document_type, document_id, created_at);


--
-- Name: idx_access_log_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_log_user ON public.documents_access_log USING btree (user_id, created_at);


--
-- Name: idx_birthdaywish_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_birthdaywish_employee ON public.birthdays_birthdaywish USING btree (employee_id);


--
-- Name: idx_booking_room_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_room_date ON public.meetings_meetingbooking USING btree (room_id, date);


--
-- Name: idx_chitiettailieu_attachment_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chitiettailieu_attachment_deleted ON public.records_chitiettailieu_attachment USING btree (is_deleted);


--
-- Name: idx_chitiettailieu_attachment_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chitiettailieu_attachment_doc ON public.records_chitiettailieu_attachment USING btree (document_id);


--
-- Name: idx_chitiettailieu_don_vi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chitiettailieu_don_vi ON public.records_chitiettailieu USING btree (don_vi_id);


--
-- Name: idx_comment_congviec; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comment_congviec ON public.task_comment USING btree (cong_viec);


--
-- Name: idx_donvi_khoi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donvi_khoi ON public.organizations_donvi USING btree (khoi_id);


--
-- Name: idx_employee_chucvu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_chucvu ON public.accounts_employee USING btree (chuc_vu_id);


--
-- Name: idx_employee_donvi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_donvi ON public.accounts_employee USING btree (don_vi_id);


--
-- Name: idx_employee_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_is_active ON public.accounts_employee USING btree (is_active);


--
-- Name: idx_hoso_ngay_lap; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hoso_ngay_lap ON public.records_hoso USING btree (ngay_lap);


--
-- Name: idx_hoso_nguoi_lap; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hoso_nguoi_lap ON public.records_hoso USING btree (nguoi_lap_id);


--
-- Name: idx_hoso_ten; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hoso_ten ON public.records_hoso USING btree (ten_ho_so);


--
-- Name: idx_loaivanban_hoso; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loaivanban_hoso ON public.records_loaivanban USING btree (ho_so_id);


--
-- Name: idx_loaivanban_ngay_lap; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loaivanban_ngay_lap ON public.records_loaivanban USING btree (ngay_lap);


--
-- Name: idx_loaivanban_ten; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loaivanban_ten ON public.records_loaivanban USING btree (ten_loai);


--
-- Name: idx_participant_congviec; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_participant_congviec ON public.task_participant USING btree (cong_viec);


--
-- Name: idx_signing_attempt_luot_truoc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_attempt_luot_truoc ON public.signing_attempt USING btree (luot_truoc_id);


--
-- Name: idx_signing_attempt_nguoi_cap_nhat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_attempt_nguoi_cap_nhat ON public.signing_attempt USING btree (nguoi_cap_nhat_id);


--
-- Name: idx_signing_attempt_nguoi_tao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_attempt_nguoi_tao ON public.signing_attempt USING btree (nguoi_tao_id);


--
-- Name: idx_signing_attempt_trinh_ky; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_attempt_trinh_ky ON public.signing_attempt USING btree (trinh_ky_id);


--
-- Name: idx_signing_audit_log_buoc_ky; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_audit_log_buoc_ky ON public.signing_audit_log USING btree (buoc_ky_id);


--
-- Name: idx_signing_audit_log_luot_trinh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_audit_log_luot_trinh ON public.signing_audit_log USING btree (luot_trinh_id);


--
-- Name: idx_signing_audit_log_nguoi_thuc_hien; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_audit_log_nguoi_thuc_hien ON public.signing_audit_log USING btree (nguoi_thuc_hien_id);


--
-- Name: idx_signing_audit_log_trinh_ky; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_audit_log_trinh_ky ON public.signing_audit_log USING btree (trinh_ky_id);


--
-- Name: idx_signing_change_message_nguoi_viet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_change_message_nguoi_viet ON public.signing_change_message USING btree (nguoi_viet_id);


--
-- Name: idx_signing_change_message_yeu_cau_sua; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_change_message_yeu_cau_sua ON public.signing_change_message USING btree (yeu_cau_sua_id);


--
-- Name: idx_signing_change_thread_luot_trinh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_change_thread_luot_trinh ON public.signing_change_thread USING btree (luot_trinh_id);


--
-- Name: idx_signing_change_thread_nguoi_yeu_cau; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_change_thread_nguoi_yeu_cau ON public.signing_change_thread USING btree (nguoi_yeu_cau_id);


--
-- Name: idx_signing_key_khoa_thay_the; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_key_khoa_thay_the ON public.signing_key USING btree (khoa_thay_the_id);


--
-- Name: idx_signing_key_nguoi_so_huu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_key_nguoi_so_huu ON public.signing_key USING btree (nguoi_so_huu_id);


--
-- Name: idx_signing_manifest_luot_trinh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_manifest_luot_trinh ON public.signing_manifest USING btree (luot_trinh_id);


--
-- Name: idx_signing_manifest_nguoi_tao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_manifest_nguoi_tao ON public.signing_manifest USING btree (nguoi_tao_id);


--
-- Name: idx_signing_notif_outbox; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_notif_outbox ON public.signing_notification USING btree (trang_thai, hen_gio_gui);


--
-- Name: idx_signing_notification_buoc_ky; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_notification_buoc_ky ON public.signing_notification USING btree (buoc_ky_id);


--
-- Name: idx_signing_notification_nguoi_nhan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_notification_nguoi_nhan ON public.signing_notification USING btree (nguoi_nhan_id);


--
-- Name: idx_signing_notification_trinh_ky; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_notification_trinh_ky ON public.signing_notification USING btree (trinh_ky_id);


--
-- Name: idx_signing_process_don_vi_ap_dung; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_process_don_vi_ap_dung ON public.signing_process USING btree (don_vi_ap_dung_id);


--
-- Name: idx_signing_process_nguoi_cap_nhat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_process_nguoi_cap_nhat ON public.signing_process USING btree (nguoi_cap_nhat_id);


--
-- Name: idx_signing_process_nguoi_tao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_process_nguoi_tao ON public.signing_process USING btree (nguoi_tao_id);


--
-- Name: idx_signing_process_step_quytrinh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_process_step_quytrinh ON public.signing_process_step USING btree (quy_trinh_id);


--
-- Name: idx_signing_process_step_signer_buoc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_process_step_signer_buoc ON public.signing_process_step_signer USING btree (buoc_quy_trinh_id);


--
-- Name: idx_signing_process_step_signer_nguoi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_process_step_signer_nguoi ON public.signing_process_step_signer USING btree (nguoi_ky_id);


--
-- Name: idx_signing_request_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_document ON public.signing_request USING btree (document_type, document_id);


--
-- Name: idx_signing_request_hanchot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_hanchot ON public.signing_request USING btree (han_chot);


--
-- Name: idx_signing_request_ho_so_goc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_ho_so_goc ON public.signing_request USING btree (ho_so_goc_id);


--
-- Name: idx_signing_request_nguoi_cap_nhat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_nguoi_cap_nhat ON public.signing_request USING btree (nguoi_cap_nhat_id);


--
-- Name: idx_signing_request_nguoi_tao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_nguoi_tao ON public.signing_request USING btree (nguoi_tao_id);


--
-- Name: idx_signing_request_quy_trinh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_quy_trinh ON public.signing_request USING btree (quy_trinh_id);


--
-- Name: idx_signing_request_step_buoc_quy_trinh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_step_buoc_quy_trinh ON public.signing_request_step USING btree (buoc_quy_trinh_id);


--
-- Name: idx_signing_request_step_hanxuly; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_step_hanxuly ON public.signing_request_step USING btree (han_xu_ly);


--
-- Name: idx_signing_request_step_luot_trinh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_step_luot_trinh ON public.signing_request_step USING btree (luot_trinh_id);


--
-- Name: idx_signing_request_step_signer_buoc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_step_signer_buoc ON public.signing_request_step_signer USING btree (buoc_ky_id);


--
-- Name: idx_signing_request_step_signer_chuky; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_step_signer_chuky ON public.signing_request_step_signer USING btree (chu_ky_hien_hanh_id);


--
-- Name: idx_signing_request_step_signer_nguoi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_step_signer_nguoi ON public.signing_request_step_signer USING btree (nguoi_ky_id);


--
-- Name: idx_signing_request_step_signer_uy_quyen; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_step_signer_uy_quyen ON public.signing_request_step_signer USING btree (uy_quyen_tu_id);


--
-- Name: idx_signing_request_trang_thai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_request_trang_thai ON public.signing_request USING btree (trang_thai);


--
-- Name: idx_signing_signature_buoc_ky; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_signature_buoc_ky ON public.signing_signature USING btree (buoc_ky_id);


--
-- Name: idx_signing_signature_khoa_ky; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_signature_khoa_ky ON public.signing_signature USING btree (khoa_ky_id);


--
-- Name: idx_signing_signature_luot_trinh; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signing_signature_luot_trinh ON public.signing_signature USING btree (luot_trinh_id);


--
-- Name: idx_task_attachment_congviec; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_attachment_congviec ON public.task_attachment USING btree (cong_viec_id);


--
-- Name: idx_task_attachment_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_attachment_deleted ON public.task_attachment USING btree (is_deleted);


--
-- Name: idx_task_congviec_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_congviec_document ON public.task_congviec USING btree (document_type, document_id);


--
-- Name: idx_task_donvi_congviec; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_donvi_congviec ON public.task_congviec_donvi USING btree (cong_viec);


--
-- Name: idx_task_donvi_donvi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_donvi_donvi ON public.task_congviec_donvi USING btree (don_vi);


--
-- Name: idx_vanbanden_attachment_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbanden_attachment_deleted ON public.documents_vanbanden_attachment USING btree (is_deleted);


--
-- Name: idx_vanbanden_attachment_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbanden_attachment_doc ON public.documents_vanbanden_attachment USING btree (document_id);


--
-- Name: idx_vanbanden_danhmuc_loai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbanden_danhmuc_loai ON public.documents_vanbanden_danhmuc USING btree (loaivanban_id);


--
-- Name: idx_vanbanden_hoso_hoso; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbanden_hoso_hoso ON public.documents_vanbanden_hoso USING btree (hoso_id);


--
-- Name: idx_vanbanden_nam; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbanden_nam ON public.documents_vanbanden USING btree (nam);


--
-- Name: idx_vanbanden_sohieu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbanden_sohieu ON public.documents_vanbanden USING btree (so_hieu);


--
-- Name: idx_vanbandi_attachment_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbandi_attachment_deleted ON public.documents_vanbandi_attachment USING btree (is_deleted);


--
-- Name: idx_vanbandi_attachment_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbandi_attachment_doc ON public.documents_vanbandi_attachment USING btree (document_id);


--
-- Name: idx_vanbandi_danhmuc_loai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbandi_danhmuc_loai ON public.documents_vanbandi_danhmuc USING btree (loaivanban_id);


--
-- Name: idx_vanbandi_hoso_hoso; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbandi_hoso_hoso ON public.documents_vanbandi_hoso USING btree (hoso_id);


--
-- Name: idx_vanbandi_nam; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbandi_nam ON public.documents_vanbandi USING btree (nam);


--
-- Name: idx_vanbandi_noibanhanh_donvi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbandi_noibanhanh_donvi ON public.documents_vanbandi_noibanhanh USING btree (donvi_id);


--
-- Name: idx_vanbandi_sohieu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vanbandi_sohieu ON public.documents_vanbandi USING btree (so_hieu);


--
-- Name: idx_viewlog_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_viewlog_document ON public.documents_view_log USING btree (document_type, document_id);


--
-- Name: token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like ON public.token_blacklist_outstandingtoken USING btree (jti varchar_pattern_ops);


--
-- Name: token_blacklist_outstandingtoken_user_id_83bc629a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX token_blacklist_outstandingtoken_user_id_83bc629a ON public.token_blacklist_outstandingtoken USING btree (user_id);


--
-- Name: uq_records_hoso_he_thong; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_records_hoso_he_thong ON public.records_hoso USING btree (is_he_thong) WHERE (is_he_thong = true);


--
-- Name: uq_records_loaivanban_hoso_ten; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_records_loaivanban_hoso_ten ON public.records_loaivanban USING btree (ho_so_id, lower(TRIM(BOTH FROM ten_loai)));


--
-- Name: uq_signing_key_mot_khoa_hoat_dong; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_signing_key_mot_khoa_hoat_dong ON public.signing_key USING btree (nguoi_so_huu_id) WHERE ((trang_thai)::text = 'HOAT_DONG'::text);


--
-- Name: uq_task_participant_one_host; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_task_participant_one_host ON public.task_participant USING btree (cong_viec) WHERE (vai_tro = 'CHU_TRI'::public.task_vaitro);


--
-- Name: work_attachment_task_kind_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_attachment_task_kind_idx ON public.work_taskattachment USING btree (task_id, kind);


--
-- Name: work_comment_task_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_comment_task_created_idx ON public.work_taskcomment USING btree (task_id, created_at);


--
-- Name: work_participant_one_host; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX work_participant_one_host ON public.work_taskparticipant USING btree (task_id) WHERE ((role)::text = 'CHU_TRI'::text);


--
-- Name: work_participant_user_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_participant_user_role_idx ON public.work_taskparticipant USING btree (user_id, role);


--
-- Name: work_task_approved_by_id_639d018d; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_task_approved_by_id_639d018d ON public.work_task USING btree (approved_by_id);


--
-- Name: work_task_created_by_id_2b386c3c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_task_created_by_id_2b386c3c ON public.work_task USING btree (created_by_id);


--
-- Name: work_task_created_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_task_created_date_idx ON public.work_task USING btree (created_date);


--
-- Name: work_task_due_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_task_due_date_idx ON public.work_task USING btree (due_date);


--
-- Name: work_task_first_opened_by_id_47498987; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_task_first_opened_by_id_47498987 ON public.work_task USING btree (first_opened_by_id);


--
-- Name: work_taskattachment_comment_id_cfb5d496; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_taskattachment_comment_id_cfb5d496 ON public.work_taskattachment USING btree (comment_id);


--
-- Name: work_taskattachment_task_id_fcaaa599; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_taskattachment_task_id_fcaaa599 ON public.work_taskattachment USING btree (task_id);


--
-- Name: work_taskattachment_uploaded_by_id_a28d76a4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_taskattachment_uploaded_by_id_a28d76a4 ON public.work_taskattachment USING btree (uploaded_by_id);


--
-- Name: work_taskcomment_author_id_0de3252e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_taskcomment_author_id_0de3252e ON public.work_taskcomment USING btree (author_id);


--
-- Name: work_taskcomment_task_id_17aea328; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_taskcomment_task_id_17aea328 ON public.work_taskcomment USING btree (task_id);


--
-- Name: work_taskparticipant_task_id_1b7cecf4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_taskparticipant_task_id_1b7cecf4 ON public.work_taskparticipant USING btree (task_id);


--
-- Name: work_taskparticipant_user_id_47085442; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX work_taskparticipant_user_id_47085442 ON public.work_taskparticipant USING btree (user_id);


--
-- Name: birthdays_birthdaywish trg_birthdaywish_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_birthdaywish_updated_at BEFORE UPDATE ON public.birthdays_birthdaywish FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: records_chitiettailieu trg_chitiettailieu_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_chitiettailieu_updated_at BEFORE UPDATE ON public.records_chitiettailieu FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: task_congviec trg_congviec_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_congviec_updated_at BEFORE UPDATE ON public.task_congviec FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: documents_vanbanden trg_del_viewlog_vanbanden; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_del_viewlog_vanbanden AFTER DELETE ON public.documents_vanbanden FOR EACH ROW EXECUTE FUNCTION public.trg_cleanup_viewlog_on_doc_delete('vanbanden');


--
-- Name: documents_vanbandi trg_del_viewlog_vanbandi; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_del_viewlog_vanbandi AFTER DELETE ON public.documents_vanbandi FOR EACH ROW EXECUTE FUNCTION public.trg_cleanup_viewlog_on_doc_delete('vanbandi');


--
-- Name: documents_access_log trg_documents_access_log_immutable; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_documents_access_log_immutable BEFORE DELETE OR UPDATE ON public.documents_access_log FOR EACH ROW EXECUTE FUNCTION public.prevent_modify_documents_access_log();


--
-- Name: birthdays_birthdayemaillog trg_emaillog_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_emaillog_updated_at BEFORE UPDATE ON public.birthdays_birthdayemaillog FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: accounts_employee trg_employee_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_employee_updated_at BEFORE UPDATE ON public.accounts_employee FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: records_hoso trg_hoso_auto_stt; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_hoso_auto_stt BEFORE INSERT ON public.records_hoso FOR EACH ROW EXECUTE FUNCTION public.auto_stt_uu_tien_hoso();


--
-- Name: records_hoso trg_hoso_prevent_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_hoso_prevent_delete BEFORE DELETE ON public.records_hoso FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_he_thong_hoso();


--
-- Name: records_hoso trg_hoso_prevent_update_he_thong; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_hoso_prevent_update_he_thong BEFORE UPDATE ON public.records_hoso FOR EACH ROW EXECUTE FUNCTION public.prevent_update_he_thong_hoso();


--
-- Name: records_hoso trg_hoso_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_hoso_updated_at BEFORE UPDATE ON public.records_hoso FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: records_loaitailieu trg_loaitailieu_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_loaitailieu_updated_at BEFORE UPDATE ON public.records_loaitailieu FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: records_loaivanban trg_loaivanban_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_loaivanban_updated_at BEFORE UPDATE ON public.records_loaivanban FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: meetings_meetingroom trg_meetingroom_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_meetingroom_updated_at BEFORE UPDATE ON public.meetings_meetingroom FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: signing_attempt trg_signing_attempt_prevent_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_signing_attempt_prevent_delete BEFORE DELETE ON public.signing_attempt FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_signing_attempt();


--
-- Name: signing_audit_log trg_signing_audit_log_immutable; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_signing_audit_log_immutable BEFORE DELETE OR UPDATE ON public.signing_audit_log FOR EACH ROW EXECUTE FUNCTION public.prevent_modify_signing_audit_log();


--
-- Name: signing_key_unlock trg_signing_key_unlock_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_signing_key_unlock_updated_at BEFORE UPDATE ON public.signing_key_unlock FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: signing_manifest trg_signing_manifest_protect; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_signing_manifest_protect BEFORE DELETE OR UPDATE ON public.signing_manifest FOR EACH ROW EXECUTE FUNCTION public.protect_final_manifest();


--
-- Name: signing_signature trg_signing_signature_immutable; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_signing_signature_immutable BEFORE DELETE OR UPDATE ON public.signing_signature FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_or_tamper_signing_signature();


--
-- Name: records_tailieu trg_tailieu_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_tailieu_updated_at BEFORE UPDATE ON public.records_tailieu FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: documents_vanbanden_danhmuc trg_vanbanden_danhmuc_cross_ref; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vanbanden_danhmuc_cross_ref BEFORE INSERT OR UPDATE ON public.documents_vanbanden_danhmuc FOR EACH ROW EXECUTE FUNCTION public.check_vanbanden_cross_reference();


--
-- Name: documents_vanbanden_hoso trg_vanbanden_hoso_del_cross_ref; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE CONSTRAINT TRIGGER trg_vanbanden_hoso_del_cross_ref AFTER DELETE ON public.documents_vanbanden_hoso DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION public.check_vanbanden_hoso_delete_cross_ref();


--
-- Name: documents_vanbanden trg_vanbanden_no_hard_delete_han_che; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vanbanden_no_hard_delete_han_che BEFORE DELETE ON public.documents_vanbanden FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_van_ban_han_che();


--
-- Name: documents_vanbanden trg_vanbanden_pham_vi_bat_bien; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vanbanden_pham_vi_bat_bien BEFORE UPDATE OF pham_vi ON public.documents_vanbanden FOR EACH ROW EXECUTE FUNCTION public.prevent_change_pham_vi();


--
-- Name: documents_vanbanden trg_vanbanden_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vanbanden_updated_at BEFORE UPDATE ON public.documents_vanbanden FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: documents_vanbandi_danhmuc trg_vanbandi_danhmuc_cross_ref; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vanbandi_danhmuc_cross_ref BEFORE INSERT OR UPDATE ON public.documents_vanbandi_danhmuc FOR EACH ROW EXECUTE FUNCTION public.check_vanbandi_cross_reference();


--
-- Name: documents_vanbandi_hoso trg_vanbandi_hoso_del_cross_ref; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE CONSTRAINT TRIGGER trg_vanbandi_hoso_del_cross_ref AFTER DELETE ON public.documents_vanbandi_hoso DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION public.check_vanbandi_hoso_delete_cross_ref();


--
-- Name: documents_vanbandi trg_vanbandi_no_hard_delete_han_che; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vanbandi_no_hard_delete_han_che BEFORE DELETE ON public.documents_vanbandi FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_van_ban_han_che();


--
-- Name: documents_vanbandi trg_vanbandi_pham_vi_bat_bien; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vanbandi_pham_vi_bat_bien BEFORE UPDATE OF pham_vi ON public.documents_vanbandi FOR EACH ROW EXECUTE FUNCTION public.prevent_change_pham_vi();


--
-- Name: documents_vanbandi trg_vanbandi_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vanbandi_updated_at BEFORE UPDATE ON public.documents_vanbandi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: accounts_employee accounts_employee_chuc_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee
    ADD CONSTRAINT accounts_employee_chuc_vu_id_fkey FOREIGN KEY (chuc_vu_id) REFERENCES public.accounts_position(id) ON DELETE RESTRICT;


--
-- Name: accounts_employee accounts_employee_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee
    ADD CONSTRAINT accounts_employee_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.organizations_donvi(id) ON DELETE RESTRICT;


--
-- Name: accounts_employee_groups accounts_employee_groups_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee_groups
    ADD CONSTRAINT accounts_employee_groups_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.accounts_employee(id) ON DELETE CASCADE;


--
-- Name: accounts_employee_groups accounts_employee_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee_groups
    ADD CONSTRAINT accounts_employee_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.auth_group(id) ON DELETE CASCADE;


--
-- Name: accounts_employee_user_permissions accounts_employee_user_permissions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee_user_permissions
    ADD CONSTRAINT accounts_employee_user_permissions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.accounts_employee(id) ON DELETE CASCADE;


--
-- Name: accounts_employee_user_permissions accounts_employee_user_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts_employee_user_permissions
    ADD CONSTRAINT accounts_employee_user_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) ON DELETE CASCADE;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.auth_group(id) ON DELETE CASCADE;


--
-- Name: auth_group_permissions auth_group_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) ON DELETE CASCADE;


--
-- Name: birthdays_birthdayemaillog birthdays_birthdayemaillog_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.birthdays_birthdayemaillog
    ADD CONSTRAINT birthdays_birthdayemaillog_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.accounts_employee(id) ON DELETE CASCADE;


--
-- Name: birthdays_birthdaywish birthdays_birthdaywish_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.birthdays_birthdaywish
    ADD CONSTRAINT birthdays_birthdaywish_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.accounts_employee(id) ON DELETE CASCADE;


--
-- Name: documents_access_log documents_access_log_doi_tuong_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_access_log
    ADD CONSTRAINT documents_access_log_doi_tuong_user_id_fkey FOREIGN KEY (doi_tuong_user_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: documents_access_log documents_access_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_access_log
    ADD CONSTRAINT documents_access_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: documents_vanbanden_attachment documents_vanbanden_attachment_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_attachment
    ADD CONSTRAINT documents_vanbanden_attachment_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents_vanbanden(id) ON DELETE CASCADE;


--
-- Name: documents_vanbanden_attachment documents_vanbanden_attachment_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_attachment
    ADD CONSTRAINT documents_vanbanden_attachment_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: documents_vanbanden_danhmuc documents_vanbanden_danhmuc_loaivanban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_danhmuc
    ADD CONSTRAINT documents_vanbanden_danhmuc_loaivanban_id_fkey FOREIGN KEY (loaivanban_id) REFERENCES public.records_loaivanban(id) ON DELETE RESTRICT;


--
-- Name: documents_vanbanden_danhmuc documents_vanbanden_danhmuc_vanbanden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_danhmuc
    ADD CONSTRAINT documents_vanbanden_danhmuc_vanbanden_id_fkey FOREIGN KEY (vanbanden_id) REFERENCES public.documents_vanbanden(id) ON DELETE CASCADE;


--
-- Name: documents_vanbanden_donvinhan documents_vanbanden_donvinhan_donvi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_donvinhan
    ADD CONSTRAINT documents_vanbanden_donvinhan_donvi_id_fkey FOREIGN KEY (donvi_id) REFERENCES public.organizations_donvi(id) ON DELETE RESTRICT;


--
-- Name: documents_vanbanden_donvinhan documents_vanbanden_donvinhan_vanbanden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_donvinhan
    ADD CONSTRAINT documents_vanbanden_donvinhan_vanbanden_id_fkey FOREIGN KEY (vanbanden_id) REFERENCES public.documents_vanbanden(id) ON DELETE CASCADE;


--
-- Name: documents_vanbanden_hoso documents_vanbanden_hoso_hoso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_hoso
    ADD CONSTRAINT documents_vanbanden_hoso_hoso_id_fkey FOREIGN KEY (hoso_id) REFERENCES public.records_hoso(id) ON DELETE RESTRICT;


--
-- Name: documents_vanbanden_hoso documents_vanbanden_hoso_vanbanden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_hoso
    ADD CONSTRAINT documents_vanbanden_hoso_vanbanden_id_fkey FOREIGN KEY (vanbanden_id) REFERENCES public.documents_vanbanden(id) ON DELETE CASCADE;


--
-- Name: documents_vanbanden documents_vanbanden_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden
    ADD CONSTRAINT documents_vanbanden_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: documents_vanbanden_nguoinhan documents_vanbanden_nguoinhan_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_nguoinhan
    ADD CONSTRAINT documents_vanbanden_nguoinhan_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: documents_vanbanden_nguoinhan documents_vanbanden_nguoinhan_vanbanden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbanden_nguoinhan
    ADD CONSTRAINT documents_vanbanden_nguoinhan_vanbanden_id_fkey FOREIGN KEY (vanbanden_id) REFERENCES public.documents_vanbanden(id) ON DELETE CASCADE;


--
-- Name: documents_vanbandi_attachment documents_vanbandi_attachment_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_attachment
    ADD CONSTRAINT documents_vanbandi_attachment_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents_vanbandi(id) ON DELETE CASCADE;


--
-- Name: documents_vanbandi_attachment documents_vanbandi_attachment_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_attachment
    ADD CONSTRAINT documents_vanbandi_attachment_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: documents_vanbandi_danhmuc documents_vanbandi_danhmuc_loaivanban_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_danhmuc
    ADD CONSTRAINT documents_vanbandi_danhmuc_loaivanban_id_fkey FOREIGN KEY (loaivanban_id) REFERENCES public.records_loaivanban(id) ON DELETE RESTRICT;


--
-- Name: documents_vanbandi_danhmuc documents_vanbandi_danhmuc_vanbandi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_danhmuc
    ADD CONSTRAINT documents_vanbandi_danhmuc_vanbandi_id_fkey FOREIGN KEY (vanbandi_id) REFERENCES public.documents_vanbandi(id) ON DELETE CASCADE;


--
-- Name: documents_vanbandi_donvinhan documents_vanbandi_donvinhan_donvi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_donvinhan
    ADD CONSTRAINT documents_vanbandi_donvinhan_donvi_id_fkey FOREIGN KEY (donvi_id) REFERENCES public.organizations_donvi(id) ON DELETE RESTRICT;


--
-- Name: documents_vanbandi_donvinhan documents_vanbandi_donvinhan_vanbandi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_donvinhan
    ADD CONSTRAINT documents_vanbandi_donvinhan_vanbandi_id_fkey FOREIGN KEY (vanbandi_id) REFERENCES public.documents_vanbandi(id) ON DELETE CASCADE;


--
-- Name: documents_vanbandi_hoso documents_vanbandi_hoso_hoso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_hoso
    ADD CONSTRAINT documents_vanbandi_hoso_hoso_id_fkey FOREIGN KEY (hoso_id) REFERENCES public.records_hoso(id) ON DELETE RESTRICT;


--
-- Name: documents_vanbandi_hoso documents_vanbandi_hoso_vanbandi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_hoso
    ADD CONSTRAINT documents_vanbandi_hoso_vanbandi_id_fkey FOREIGN KEY (vanbandi_id) REFERENCES public.documents_vanbandi(id) ON DELETE CASCADE;


--
-- Name: documents_vanbandi documents_vanbandi_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi
    ADD CONSTRAINT documents_vanbandi_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: documents_vanbandi_nguoinhan documents_vanbandi_nguoinhan_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_nguoinhan
    ADD CONSTRAINT documents_vanbandi_nguoinhan_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: documents_vanbandi_nguoinhan documents_vanbandi_nguoinhan_vanbandi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_nguoinhan
    ADD CONSTRAINT documents_vanbandi_nguoinhan_vanbandi_id_fkey FOREIGN KEY (vanbandi_id) REFERENCES public.documents_vanbandi(id) ON DELETE CASCADE;


--
-- Name: documents_vanbandi_noibanhanh documents_vanbandi_noibanhanh_donvi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_noibanhanh
    ADD CONSTRAINT documents_vanbandi_noibanhanh_donvi_id_fkey FOREIGN KEY (donvi_id) REFERENCES public.organizations_donvi(id) ON DELETE RESTRICT;


--
-- Name: documents_vanbandi_noibanhanh documents_vanbandi_noibanhanh_vanbandi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_vanbandi_noibanhanh
    ADD CONSTRAINT documents_vanbandi_noibanhanh_vanbandi_id_fkey FOREIGN KEY (vanbandi_id) REFERENCES public.documents_vanbandi(id) ON DELETE CASCADE;


--
-- Name: documents_view_log documents_view_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_view_log
    ADD CONSTRAINT documents_view_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts_employee(id) ON DELETE CASCADE;


--
-- Name: signing_request_step_signer fk_signer_chu_ky_hien_hanh; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step_signer
    ADD CONSTRAINT fk_signer_chu_ky_hien_hanh FOREIGN KEY (chu_ky_hien_hanh_id) REFERENCES public.signing_signature(id) ON DELETE SET NULL;


--
-- Name: meetings_meetingbooking meetings_meetingbooking_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings_meetingbooking
    ADD CONSTRAINT meetings_meetingbooking_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.organizations_donvi(id) ON DELETE SET NULL;


--
-- Name: meetings_meetingbooking meetings_meetingbooking_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings_meetingbooking
    ADD CONSTRAINT meetings_meetingbooking_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: meetings_meetingbooking meetings_meetingbooking_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings_meetingbooking
    ADD CONSTRAINT meetings_meetingbooking_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.meetings_meetingroom(id) ON DELETE RESTRICT;


--
-- Name: organizations_donvi organizations_donvi_khoi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations_donvi
    ADD CONSTRAINT organizations_donvi_khoi_id_fkey FOREIGN KEY (khoi_id) REFERENCES public.organizations_khoi(id) ON DELETE RESTRICT;


--
-- Name: records_chitiettailieu_attachment records_chitiettailieu_attachment_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu_attachment
    ADD CONSTRAINT records_chitiettailieu_attachment_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.records_chitiettailieu(id) ON DELETE CASCADE;


--
-- Name: records_chitiettailieu_attachment records_chitiettailieu_attachment_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu_attachment
    ADD CONSTRAINT records_chitiettailieu_attachment_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: records_chitiettailieu records_chitiettailieu_dm_tai_lieu_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu
    ADD CONSTRAINT records_chitiettailieu_dm_tai_lieu_fkey FOREIGN KEY (dm_tai_lieu) REFERENCES public.records_tailieu(id) ON DELETE RESTRICT;


--
-- Name: records_chitiettailieu records_chitiettailieu_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu
    ADD CONSTRAINT records_chitiettailieu_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.organizations_donvi(id) ON DELETE RESTRICT;


--
-- Name: records_chitiettailieu_loaitailieu records_chitiettailieu_loaitailieu_chitiettailieu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu_loaitailieu
    ADD CONSTRAINT records_chitiettailieu_loaitailieu_chitiettailieu_id_fkey FOREIGN KEY (chitiettailieu_id) REFERENCES public.records_chitiettailieu(id) ON DELETE CASCADE;


--
-- Name: records_chitiettailieu_loaitailieu records_chitiettailieu_loaitailieu_loaitailieu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu_loaitailieu
    ADD CONSTRAINT records_chitiettailieu_loaitailieu_loaitailieu_id_fkey FOREIGN KEY (loaitailieu_id) REFERENCES public.records_loaitailieu(id) ON DELETE RESTRICT;


--
-- Name: records_chitiettailieu records_chitiettailieu_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_chitiettailieu
    ADD CONSTRAINT records_chitiettailieu_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: records_hoso records_hoso_nguoi_lap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_hoso
    ADD CONSTRAINT records_hoso_nguoi_lap_id_fkey FOREIGN KEY (nguoi_lap_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: records_loaitailieu records_loaitailieu_dm_tai_lieu_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_loaitailieu
    ADD CONSTRAINT records_loaitailieu_dm_tai_lieu_fkey FOREIGN KEY (dm_tai_lieu) REFERENCES public.records_tailieu(id) ON DELETE RESTRICT;


--
-- Name: records_loaivanban records_loaivanban_ho_so_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_loaivanban
    ADD CONSTRAINT records_loaivanban_ho_so_id_fkey FOREIGN KEY (ho_so_id) REFERENCES public.records_hoso(id) ON DELETE RESTRICT;


--
-- Name: records_tailieu records_tailieu_nguoi_lap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.records_tailieu
    ADD CONSTRAINT records_tailieu_nguoi_lap_id_fkey FOREIGN KEY (nguoi_lap_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_attempt signing_attempt_luot_truoc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_attempt
    ADD CONSTRAINT signing_attempt_luot_truoc_id_fkey FOREIGN KEY (luot_truoc_id) REFERENCES public.signing_attempt(id) ON DELETE RESTRICT;


--
-- Name: signing_attempt signing_attempt_nguoi_cap_nhat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_attempt
    ADD CONSTRAINT signing_attempt_nguoi_cap_nhat_id_fkey FOREIGN KEY (nguoi_cap_nhat_id) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: signing_attempt signing_attempt_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_attempt
    ADD CONSTRAINT signing_attempt_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_attempt signing_attempt_trinh_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_attempt
    ADD CONSTRAINT signing_attempt_trinh_ky_id_fkey FOREIGN KEY (trinh_ky_id) REFERENCES public.signing_request(id) ON DELETE RESTRICT;


--
-- Name: signing_audit_log signing_audit_log_buoc_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_audit_log
    ADD CONSTRAINT signing_audit_log_buoc_ky_id_fkey FOREIGN KEY (buoc_ky_id) REFERENCES public.signing_request_step_signer(id) ON DELETE RESTRICT;


--
-- Name: signing_audit_log signing_audit_log_luot_trinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_audit_log
    ADD CONSTRAINT signing_audit_log_luot_trinh_id_fkey FOREIGN KEY (luot_trinh_id) REFERENCES public.signing_attempt(id) ON DELETE RESTRICT;


--
-- Name: signing_audit_log signing_audit_log_nguoi_thuc_hien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_audit_log
    ADD CONSTRAINT signing_audit_log_nguoi_thuc_hien_id_fkey FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_audit_log signing_audit_log_trinh_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_audit_log
    ADD CONSTRAINT signing_audit_log_trinh_ky_id_fkey FOREIGN KEY (trinh_ky_id) REFERENCES public.signing_request(id) ON DELETE RESTRICT;


--
-- Name: signing_change_message signing_change_message_nguoi_viet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_change_message
    ADD CONSTRAINT signing_change_message_nguoi_viet_id_fkey FOREIGN KEY (nguoi_viet_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_change_message signing_change_message_yeu_cau_sua_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_change_message
    ADD CONSTRAINT signing_change_message_yeu_cau_sua_id_fkey FOREIGN KEY (yeu_cau_sua_id) REFERENCES public.signing_change_thread(id) ON DELETE RESTRICT;


--
-- Name: signing_change_thread signing_change_thread_luot_trinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_change_thread
    ADD CONSTRAINT signing_change_thread_luot_trinh_id_fkey FOREIGN KEY (luot_trinh_id) REFERENCES public.signing_attempt(id) ON DELETE RESTRICT;


--
-- Name: signing_change_thread signing_change_thread_nguoi_yeu_cau_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_change_thread
    ADD CONSTRAINT signing_change_thread_nguoi_yeu_cau_id_fkey FOREIGN KEY (nguoi_yeu_cau_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_key signing_key_khoa_thay_the_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_key
    ADD CONSTRAINT signing_key_khoa_thay_the_id_fkey FOREIGN KEY (khoa_thay_the_id) REFERENCES public.signing_key(id) ON DELETE RESTRICT;


--
-- Name: signing_key signing_key_nguoi_so_huu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_key
    ADD CONSTRAINT signing_key_nguoi_so_huu_id_fkey FOREIGN KEY (nguoi_so_huu_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_key_unlock signing_key_unlock_khoa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_key_unlock
    ADD CONSTRAINT signing_key_unlock_khoa_id_fkey FOREIGN KEY (khoa_id) REFERENCES public.signing_key(id) ON DELETE CASCADE;


--
-- Name: signing_manifest signing_manifest_luot_trinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_manifest
    ADD CONSTRAINT signing_manifest_luot_trinh_id_fkey FOREIGN KEY (luot_trinh_id) REFERENCES public.signing_attempt(id) ON DELETE RESTRICT;


--
-- Name: signing_manifest signing_manifest_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_manifest
    ADD CONSTRAINT signing_manifest_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_notification signing_notification_buoc_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_notification
    ADD CONSTRAINT signing_notification_buoc_ky_id_fkey FOREIGN KEY (buoc_ky_id) REFERENCES public.signing_request_step_signer(id) ON DELETE CASCADE;


--
-- Name: signing_notification signing_notification_nguoi_nhan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_notification
    ADD CONSTRAINT signing_notification_nguoi_nhan_id_fkey FOREIGN KEY (nguoi_nhan_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_notification signing_notification_trinh_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_notification
    ADD CONSTRAINT signing_notification_trinh_ky_id_fkey FOREIGN KEY (trinh_ky_id) REFERENCES public.signing_request(id) ON DELETE CASCADE;


--
-- Name: signing_process signing_process_don_vi_ap_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process
    ADD CONSTRAINT signing_process_don_vi_ap_dung_id_fkey FOREIGN KEY (don_vi_ap_dung_id) REFERENCES public.organizations_donvi(id) ON DELETE RESTRICT;


--
-- Name: signing_process signing_process_nguoi_cap_nhat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process
    ADD CONSTRAINT signing_process_nguoi_cap_nhat_id_fkey FOREIGN KEY (nguoi_cap_nhat_id) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: signing_process signing_process_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process
    ADD CONSTRAINT signing_process_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_process_step signing_process_step_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process_step
    ADD CONSTRAINT signing_process_step_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.organizations_donvi(id) ON DELETE SET NULL;


--
-- Name: signing_process_step signing_process_step_quy_trinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process_step
    ADD CONSTRAINT signing_process_step_quy_trinh_id_fkey FOREIGN KEY (quy_trinh_id) REFERENCES public.signing_process(id) ON DELETE CASCADE;


--
-- Name: signing_process_step_signer signing_process_step_signer_buoc_quy_trinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process_step_signer
    ADD CONSTRAINT signing_process_step_signer_buoc_quy_trinh_id_fkey FOREIGN KEY (buoc_quy_trinh_id) REFERENCES public.signing_process_step(id) ON DELETE CASCADE;


--
-- Name: signing_process_step_signer signing_process_step_signer_chuc_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process_step_signer
    ADD CONSTRAINT signing_process_step_signer_chuc_vu_id_fkey FOREIGN KEY (chuc_vu_id) REFERENCES public.accounts_position(id) ON DELETE RESTRICT;


--
-- Name: signing_process_step_signer signing_process_step_signer_nguoi_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_process_step_signer
    ADD CONSTRAINT signing_process_step_signer_nguoi_ky_id_fkey FOREIGN KEY (nguoi_ky_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_request signing_request_ho_so_goc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request
    ADD CONSTRAINT signing_request_ho_so_goc_id_fkey FOREIGN KEY (ho_so_goc_id) REFERENCES public.signing_request(id) ON DELETE RESTRICT;


--
-- Name: signing_request signing_request_nguoi_cap_nhat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request
    ADD CONSTRAINT signing_request_nguoi_cap_nhat_id_fkey FOREIGN KEY (nguoi_cap_nhat_id) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: signing_request signing_request_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request
    ADD CONSTRAINT signing_request_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_request signing_request_quy_trinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request
    ADD CONSTRAINT signing_request_quy_trinh_id_fkey FOREIGN KEY (quy_trinh_id) REFERENCES public.signing_process(id) ON DELETE RESTRICT;


--
-- Name: signing_request_step signing_request_step_buoc_quy_trinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step
    ADD CONSTRAINT signing_request_step_buoc_quy_trinh_id_fkey FOREIGN KEY (buoc_quy_trinh_id) REFERENCES public.signing_process_step(id) ON DELETE RESTRICT;


--
-- Name: signing_request_step signing_request_step_luot_trinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step
    ADD CONSTRAINT signing_request_step_luot_trinh_id_fkey FOREIGN KEY (luot_trinh_id) REFERENCES public.signing_attempt(id) ON DELETE RESTRICT;


--
-- Name: signing_request_step_signer signing_request_step_signer_buoc_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step_signer
    ADD CONSTRAINT signing_request_step_signer_buoc_ky_id_fkey FOREIGN KEY (buoc_ky_id) REFERENCES public.signing_request_step(id) ON DELETE RESTRICT;


--
-- Name: signing_request_step_signer signing_request_step_signer_chuc_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step_signer
    ADD CONSTRAINT signing_request_step_signer_chuc_vu_id_fkey FOREIGN KEY (chuc_vu_id) REFERENCES public.accounts_position(id) ON DELETE SET NULL;


--
-- Name: signing_request_step_signer signing_request_step_signer_nguoi_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step_signer
    ADD CONSTRAINT signing_request_step_signer_nguoi_ky_id_fkey FOREIGN KEY (nguoi_ky_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_request_step_signer signing_request_step_signer_uy_quyen_tu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_request_step_signer
    ADD CONSTRAINT signing_request_step_signer_uy_quyen_tu_id_fkey FOREIGN KEY (uy_quyen_tu_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: signing_signature signing_signature_buoc_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_signature
    ADD CONSTRAINT signing_signature_buoc_ky_id_fkey FOREIGN KEY (buoc_ky_id) REFERENCES public.signing_request_step_signer(id) ON DELETE RESTRICT;


--
-- Name: signing_signature signing_signature_khoa_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_signature
    ADD CONSTRAINT signing_signature_khoa_ky_id_fkey FOREIGN KEY (khoa_ky_id) REFERENCES public.signing_key(id) ON DELETE RESTRICT;


--
-- Name: signing_signature signing_signature_luot_trinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signing_signature
    ADD CONSTRAINT signing_signature_luot_trinh_id_fkey FOREIGN KEY (luot_trinh_id) REFERENCES public.signing_attempt(id) ON DELETE RESTRICT;


--
-- Name: task_attachment task_attachment_cong_viec_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachment
    ADD CONSTRAINT task_attachment_cong_viec_id_fkey FOREIGN KEY (cong_viec_id) REFERENCES public.task_congviec(id) ON DELETE CASCADE;


--
-- Name: task_attachment task_attachment_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachment
    ADD CONSTRAINT task_attachment_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: task_attachment task_attachment_y_kien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachment
    ADD CONSTRAINT task_attachment_y_kien_id_fkey FOREIGN KEY (y_kien_id) REFERENCES public.task_comment(id) ON DELETE CASCADE;


--
-- Name: task_comment task_comment_cong_viec_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comment
    ADD CONSTRAINT task_comment_cong_viec_fkey FOREIGN KEY (cong_viec) REFERENCES public.task_congviec(id) ON DELETE CASCADE;


--
-- Name: task_comment task_comment_nguoi_ghi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comment
    ADD CONSTRAINT task_comment_nguoi_ghi_fkey FOREIGN KEY (nguoi_ghi) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: task_congviec task_congviec_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_congviec
    ADD CONSTRAINT task_congviec_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: task_congviec_donvi task_congviec_donvi_cong_viec_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_congviec_donvi
    ADD CONSTRAINT task_congviec_donvi_cong_viec_fkey FOREIGN KEY (cong_viec) REFERENCES public.task_congviec(id) ON DELETE CASCADE;


--
-- Name: task_congviec_donvi task_congviec_donvi_don_vi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_congviec_donvi
    ADD CONSTRAINT task_congviec_donvi_don_vi_fkey FOREIGN KEY (don_vi) REFERENCES public.organizations_donvi(id) ON DELETE CASCADE;


--
-- Name: task_congviec task_congviec_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_congviec
    ADD CONSTRAINT task_congviec_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: task_congviec task_congviec_opened_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_congviec
    ADD CONSTRAINT task_congviec_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES public.accounts_employee(id) ON DELETE SET NULL;


--
-- Name: task_participant task_participant_can_bo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_participant
    ADD CONSTRAINT task_participant_can_bo_fkey FOREIGN KEY (can_bo) REFERENCES public.accounts_employee(id) ON DELETE RESTRICT;


--
-- Name: task_participant task_participant_cong_viec_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_participant
    ADD CONSTRAINT task_participant_cong_viec_fkey FOREIGN KEY (cong_viec) REFERENCES public.task_congviec(id) ON DELETE CASCADE;


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk FOREIGN KEY (token_id) REFERENCES public.token_blacklist_outstandingtoken(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outs_user_id_83bc629a_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outs_user_id_83bc629a_fk_accounts_ FOREIGN KEY (user_id) REFERENCES public.accounts_employee(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: work_task work_task_approved_by_id_639d018d_fk_accounts_employee_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_task
    ADD CONSTRAINT work_task_approved_by_id_639d018d_fk_accounts_employee_id FOREIGN KEY (approved_by_id) REFERENCES public.accounts_employee(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: work_task work_task_created_by_id_2b386c3c_fk_accounts_employee_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_task
    ADD CONSTRAINT work_task_created_by_id_2b386c3c_fk_accounts_employee_id FOREIGN KEY (created_by_id) REFERENCES public.accounts_employee(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: work_task work_task_first_opened_by_id_47498987_fk_accounts_employee_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_task
    ADD CONSTRAINT work_task_first_opened_by_id_47498987_fk_accounts_employee_id FOREIGN KEY (first_opened_by_id) REFERENCES public.accounts_employee(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: work_taskattachment work_taskattachment_comment_id_cfb5d496_fk_work_taskcomment_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskattachment
    ADD CONSTRAINT work_taskattachment_comment_id_cfb5d496_fk_work_taskcomment_id FOREIGN KEY (comment_id) REFERENCES public.work_taskcomment(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: work_taskattachment work_taskattachment_task_id_fcaaa599_fk_work_task_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskattachment
    ADD CONSTRAINT work_taskattachment_task_id_fcaaa599_fk_work_task_id FOREIGN KEY (task_id) REFERENCES public.work_task(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: work_taskattachment work_taskattachment_uploaded_by_id_a28d76a4_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskattachment
    ADD CONSTRAINT work_taskattachment_uploaded_by_id_a28d76a4_fk_accounts_ FOREIGN KEY (uploaded_by_id) REFERENCES public.accounts_employee(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: work_taskcomment work_taskcomment_author_id_0de3252e_fk_accounts_employee_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskcomment
    ADD CONSTRAINT work_taskcomment_author_id_0de3252e_fk_accounts_employee_id FOREIGN KEY (author_id) REFERENCES public.accounts_employee(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: work_taskcomment work_taskcomment_task_id_17aea328_fk_work_task_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskcomment
    ADD CONSTRAINT work_taskcomment_task_id_17aea328_fk_work_task_id FOREIGN KEY (task_id) REFERENCES public.work_task(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: work_taskparticipant work_taskparticipant_task_id_1b7cecf4_fk_work_task_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskparticipant
    ADD CONSTRAINT work_taskparticipant_task_id_1b7cecf4_fk_work_task_id FOREIGN KEY (task_id) REFERENCES public.work_task(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: work_taskparticipant work_taskparticipant_user_id_47085442_fk_accounts_employee_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_taskparticipant
    ADD CONSTRAINT work_taskparticipant_user_id_47085442_fk_accounts_employee_id FOREIGN KEY (user_id) REFERENCES public.accounts_employee(id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

\unrestrict VgUTckWxoQrFfe9BJ1DF7Oq4PXJAj05XgNe5xqgPBMcIzNkfhGJ9BwDuzGMgk2r

